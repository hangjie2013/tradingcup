import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get active cups
    const { data: cups } = await supabase
      .from('cups')
      .select('*')
      .eq('status', 'active')

    if (!cups || cups.length === 0) {
      return new Response(JSON.stringify({ message: 'No active cups' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = []

    for (const cup of cups) {
      const now = new Date()
      const endAt = cup.end_at ? new Date(cup.end_at) : null

      if (endAt && now > endAt) {
        await supabase.from('cups').update({ status: 'ended' }).eq('id', cup.id)
        results.push({ cup_id: cup.id, action: 'ended' })
        continue
      }

      const { data: participants } = await supabase
        .from('cup_participants')
        .select('*')
        .eq('cup_id', cup.id)
        .eq('is_disqualified', false)

      if (!participants?.length) continue

      const startAt = cup.start_at ? new Date(cup.start_at).getTime() : 0
      const updated = []

      for (const participant of participants) {
        const { data: apiKey } = await supabase
          .from('exchange_api_keys')
          .select('encrypted_api_key, encrypted_api_secret')
          .eq('user_id', participant.user_id)
          .eq('exchange', 'lbank')
          .single()

        if (!apiKey) continue

        try {
          // Note: In Edge Function context, decrypt using Web Crypto API
          const key = await decryptAesGcm(apiKey.encrypted_api_key, encryptionKey)
          const secret = await decryptAesGcm(apiKey.encrypted_api_secret, encryptionKey)

          const balance = await getLBankUSDTBalance(key, secret)
          const volume = await getLBankVolume(key, secret, startAt)

          const startBalance = participant.start_balance_usdt ?? balance
          const pnl = balance - startBalance
          const pnlPct = startBalance > 0 ? (pnl / startBalance) * 100 : 0
          const isEligible = volume >= (cup.min_volume_usdt ?? 100)

          await supabase.from('cup_snapshots').insert({
            cup_id: cup.id,
            user_id: participant.user_id,
            balance_usdt: balance,
            volume_since_start: volume,
            pnl_pct: pnlPct,
          })

          await supabase
            .from('cup_participants')
            .update({ total_volume_usdt: volume, pnl, pnl_pct: pnlPct, is_eligible: isEligible })
            .eq('id', participant.id)

          updated.push({ user_id: participant.user_id, pnl_pct: pnlPct })
        } catch (err) {
          console.error(`Error for user ${participant.user_id}:`, err)
        }
      }

      // Update ranks
      updated.sort((a, b) => b.pnl_pct - a.pnl_pct)
      for (let i = 0; i < updated.length; i++) {
        await supabase
          .from('cup_participants')
          .update({ rank: i + 1 })
          .eq('cup_id', cup.id)
          .eq('user_id', updated[i].user_id)
      }

      results.push({ cup_id: cup.id, updated: updated.length })
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// AES-256-GCM decryption using Web Crypto API
async function decryptAesGcm(ciphertext: string, keyString: string): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const tag = combined.slice(12, 28) // ignored by Web Crypto (tag is appended to ciphertext)
  const encrypted = combined.slice(28)
  const encryptedWithTag = new Uint8Array([...encrypted, ...tag])

  const keyBytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(keyString)
  )
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedWithTag
  )

  return new TextDecoder().decode(decrypted)
}

// LBank API helpers (simplified for Edge Function)
async function buildLBankRequest(
  params: Record<string, string>,
  apiKey: string,
  secretKey: string
) {
  const timestamp = Date.now().toString()
  const echostr = Array.from({ length: 35 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('')

  const allParams: Record<string, string> = {
    ...params,
    api_key: apiKey,
    signature_method: 'HmacSHA256',
    timestamp,
    echostr,
  }

  // Sort and build string
  const sorted = Object.keys(allParams)
    .sort()
    .map((k) => `${k}=${allParams[k]}`)
    .join('&')

  // MD5 hash (uppercase)
  const md5Hash = await md5Uppercase(sorted)

  // HmacSHA256 signature
  const keyBytes = new TextEncoder().encode(secretKey)
  const hmacKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBytes = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(md5Hash))
  const signature = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  allParams['sign'] = signature

  return {
    body: new URLSearchParams(allParams).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      echostr,
      timestamp,
      signature_method: 'HmacSHA256',
    },
  }
}

async function md5Uppercase(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer).catch(() => {
    // MD5 not available in some environments - fallback
    throw new Error('MD5 not available')
  })
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function getLBankUSDTBalance(apiKey: string, secretKey: string): Promise<number> {
  const { body, headers } = await buildLBankRequest({}, apiKey, secretKey)
  const res = await fetch('https://api.lbkex.com/v2/supplement/user_info_account.do', {
    method: 'POST',
    headers,
    body,
  })
  const json = await res.json()
  const free = json?.data?.info?.free?.usdt ?? '0'
  const freeze = json?.data?.info?.freeze?.usdt ?? '0'
  return parseFloat(free) + parseFloat(freeze)
}

async function getLBankVolume(
  apiKey: string,
  secretKey: string,
  startTimestamp: number
): Promise<number> {
  const { body, headers } = await buildLBankRequest(
    { symbol: 'izky_usdt', current_page: '1', page_length: '100' },
    apiKey,
    secretKey
  )
  const res = await fetch('https://api.lbkex.com/v2/supplement/transaction_history.do', {
    method: 'POST',
    headers,
    body,
  })
  const json = await res.json()
  const orders = json?.data?.orders ?? []

  let total = 0
  for (const order of orders) {
    const t = parseInt(order.transactTime ?? '0')
    if (t < startTimestamp) continue
    const vol = parseFloat(order.dealVolume ?? '0') * parseFloat(order.dealPrice ?? '0')
    if (!isNaN(vol)) total += vol
  }
  return total
}
