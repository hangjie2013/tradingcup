import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'cup-covers'

export const storageRepository = {
  async uploadCupCover(cupId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const objectKey = `${cupId}.${ext}`
    const buffer = await file.arrayBuffer()

    const supabase = createServiceClient()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectKey, buffer, { contentType: file.type, upsert: true })

    if (error) throw error
    return objectKey
  },

  getCupCoverUrl(objectKey: string): string {
    const supabase = createServiceClient()
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(objectKey)
    return publicUrl
  },
}
