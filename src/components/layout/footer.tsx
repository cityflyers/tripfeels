'use client'

import { Facebook, Instagram, Users } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear()
  type SocialLinks = { facebook: string; instagram: string; community: string }
  const [settings, setSettings] = useState<{ social?: SocialLinks } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tripfeels-footer-settings')
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const obj = parsed as Record<string, unknown>
          const socialRaw = obj.social
          let social: SocialLinks | undefined
          if (socialRaw && typeof socialRaw === 'object') {
            const s = socialRaw as Record<string, unknown>
            social = {
              facebook: typeof s.facebook === 'string' ? s.facebook : '',
              instagram: typeof s.instagram === 'string' ? s.instagram : '',
              community: typeof s.community === 'string' ? s.community : '',
            }
          }
          if (social) {
            setSettings({ social })
          }
        }
      }
    } catch (e) {
      console.error('footer localStorage error:', e)
    }
  }, [])

  return (
    <footer className={cn('', className)}>
      <div className="w-full border-t border-[var(--tf-divider)] bg-[var(--tf-footer-bg)] shadow-xl">
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
            {/* Left: Social icons (desktop/tablet only) */}
            <div className="hidden sm:flex items-center gap-5">
              {settings?.social?.facebook && settings.social.facebook !== '' && (
                <Link
                  href={settings.social.facebook}
                  aria-label="Facebook"
                  className="text-[var(--tf-text-secondary)] hover:text-[#10b981] transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
              )}
              {settings?.social?.instagram && settings.social.instagram !== '' && (
                <Link
                  href={settings.social.instagram}
                  aria-label="Instagram"
                  className="text-[var(--tf-text-secondary)] hover:text-[#f59e0b] transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
              )}
              {settings?.social?.community && settings.social.community !== '' && (
                <Link
                  href={settings.social.community}
                  aria-label="Community"
                  className="text-[var(--tf-text-secondary)] hover:text-[#60a5fa] transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Users className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Center: Links */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 text-sm font-medium">
              <Link
                href="/privacy"
                className="text-[var(--tf-text-secondary)] hover:text-[var(--tf-primary)] transition-colors duration-200 whitespace-nowrap"
              >
                Privacy Policy
              </Link>
              <span className="text-[var(--tf-border)]">&middot;</span>
              <Link
                href="/terms"
                className="text-[var(--tf-text-secondary)] hover:text-[var(--tf-primary)] transition-colors duration-200 whitespace-nowrap"
              >
                Terms & Conditions
              </Link>
            </div>

            {/* Right: Copyright */}
            <div className="flex items-center justify-center sm:justify-end text-sm font-medium text-[var(--tf-text-secondary)] whitespace-nowrap">
              &copy; {year} <span className="ml-1 text-[var(--tf-primary)] font-bold">tripfeels</span>. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
