'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface BannerData {
  id: string
  image_url: string
  link_url: string | null
}

export function CampaignBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null)

  useEffect(() => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then(({ data }) => {
        if (data) setBanner(data)
      })
      .catch(() => {})
  }, [])

  if (!banner) return null

  const image = (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-[0px_8px_24px_0px_rgba(13,13,26,0.8)]">
      <Image
        src={banner.image_url}
        alt="Campaign banner"
        width={1200}
        height={400}
        className="w-full h-auto object-cover"
        priority
      />
    </div>
  )

  if (banner.link_url) {
    return (
      <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
        {image}
      </a>
    )
  }

  return image
}
