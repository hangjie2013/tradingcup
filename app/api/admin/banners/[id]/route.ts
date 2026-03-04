import { NextRequest, NextResponse } from 'next/server'
import { bannerRepository } from '@/lib/repositories/banner'
import { storageRepository } from '@/lib/storage'
import { requireAdmin } from '@/lib/auth/admin'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_PATCH_FIELDS = ['link_url', 'sort_order', 'is_active'] as const

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response
    }

    const body = await request.json()
    const patch = Object.fromEntries(
      Object.entries(body).filter(([k]) =>
        (ALLOWED_PATCH_FIELDS as readonly string[]).includes(k)
      )
    )

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const banner = await bannerRepository.update(id, patch)
    return NextResponse.json({
      data: {
        ...banner,
        image_url: storageRepository.getBannerUrl(banner.image_key),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const adminCheck = await requireAdmin()
    if (!adminCheck.authorized) {
      return adminCheck.response
    }

    await bannerRepository.delete(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
