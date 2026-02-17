'use client'

import { Plane } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AirlineLogoProps {
  airlineId: string
  className?: string
  size?: number
}

export function AirlineLogo({ airlineId, className = '', size = 64 }: AirlineLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    // Use the kiwi.com URL format for airline logos
    const logoUrl = `https://images.kiwi.com/airlines/64x64/${airlineId}.png`
    setLogoUrl(logoUrl)
    setImgError(false)
  }, [airlineId])

  if (imgError || !logoUrl) {
    return (
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded bg-[var(--tf-surface-alt)]/35 ${className}`}
        style={{ width: size, height: size }}
      >
        <Plane className="h-1/2 w-1/2 text-[var(--tf-text-muted)]" />
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={`${airlineId} airline logo`}
      className={`rounded flex-shrink-0 ${className}`}
      style={{ width: size, height: size, objectFit: 'contain' }}
      onError={() => setImgError(true)}
    />
  )
}
