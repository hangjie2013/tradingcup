import { createServiceClient } from '@/lib/supabase/server'
import { Banner } from '@/types/database'

export interface BannerCreateInput {
  image_key: string
  link_url?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface BannerUpdateInput {
  image_key?: string
  link_url?: string | null
  sort_order?: number
  is_active?: boolean
}

export const bannerRepository = {
  async findActive(): Promise<Banner | null> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async findAll(): Promise<Banner[]> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async create(input: BannerCreateInput): Promise<Banner> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('banners')
      .insert({
        image_key: input.image_key,
        link_url: input.link_url ?? null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, patch: BannerUpdateInput): Promise<Banner> {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('banners')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = createServiceClient()
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
  },
}
