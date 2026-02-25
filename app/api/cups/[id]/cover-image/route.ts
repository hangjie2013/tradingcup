import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storageRepository } from '@/lib/storage'
import { cupRepository } from '@/lib/repositories/cup'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    // Upload and get object_key (not URL)
    const objectKey = await storageRepository.uploadCupCover(id, file)

    // Save object_key to both columns: cover_image_key (Phase 3) and cover_image_url (互換)
    await cupRepository.update(id, {
      cover_image_key: objectKey,
      cover_image_url: objectKey,
    })

    // Return the public URL for immediate use in the UI
    const url = storageRepository.getCupCoverUrl(objectKey)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Cover image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
