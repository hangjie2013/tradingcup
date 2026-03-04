import { createServiceClient } from '@/lib/supabase/server'

const CUP_COVERS_BUCKET = 'cup-covers'
const BANNERS_BUCKET = 'banners'

export const storageRepository = {
  async uploadCupCover(cupId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const objectKey = `${cupId}.${ext}`
    const buffer = await file.arrayBuffer()

    const supabase = createServiceClient()
    const { error } = await supabase.storage
      .from(CUP_COVERS_BUCKET)
      .upload(objectKey, buffer, { contentType: file.type, upsert: true })

    if (error) throw error
    return objectKey
  },

  getCupCoverUrl(objectKey: string): string {
    const supabase = createServiceClient()
    const {
      data: { publicUrl },
    } = supabase.storage.from(CUP_COVERS_BUCKET).getPublicUrl(objectKey)
    return publicUrl
  },

  async uploadBanner(bannerId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const objectKey = `${bannerId}.${ext}`
    const buffer = await file.arrayBuffer()

    const supabase = createServiceClient()
    const { error } = await supabase.storage
      .from(BANNERS_BUCKET)
      .upload(objectKey, buffer, { contentType: file.type, upsert: true })

    if (error) throw error
    return objectKey
  },

  getBannerUrl(objectKey: string): string {
    const supabase = createServiceClient()
    const {
      data: { publicUrl },
    } = supabase.storage.from(BANNERS_BUCKET).getPublicUrl(objectKey)
    return publicUrl
  },
}
