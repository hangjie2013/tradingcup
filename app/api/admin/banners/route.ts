import { NextRequest, NextResponse } from 'next/server'
import { bannerRepository } from '@/lib/repositories/banner'
import { storageRepository } from '@/lib/storage'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET() {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response
    }

    const banners = await bannerRepository.findAll()
    const bannersWithUrls = banners.map((b) => ({
      ...b,
      image_url: storageRepository.getBannerUrl(b.image_key),
    }))

    return NextResponse.json({ data: bannersWithUrls })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const linkUrl = formData.get('link_url') as string | null
    const sortOrder = formData.get('sort_order') as string | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 })
    }

    // Create banner record first to get ID
    const banner = await bannerRepository.create({
      image_key: 'pending',
      link_url: linkUrl || null,
      sort_order: sortOrder ? parseInt(sortOrder, 10) : 0,
    })

    // Upload image with banner ID as key
    const imageKey = await storageRepository.uploadBanner(banner.id, file)

    // Update with actual image_key
    const updated = await bannerRepository.update(banner.id, { image_key: imageKey })

    return NextResponse.json({
      data: {
        ...updated,
        image_url: storageRepository.getBannerUrl(updated.image_key),
      },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
