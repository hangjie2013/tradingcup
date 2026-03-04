import { NextResponse } from 'next/server'
import { bannerRepository } from '@/lib/repositories/banner'
import { storageRepository } from '@/lib/storage'

export async function GET() {
  try {
    const banner = await bannerRepository.findActive()

    if (!banner) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({
      data: {
        ...banner,
        image_url: storageRepository.getBannerUrl(banner.image_key),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 })
  }
}
