'use client'

import { Type, Image as ImageIcon, Save, Eye } from 'lucide-react'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useThemeSystem } from '@/components/theme-provider'
import ThemeSelector from '@/components/theme-selector'
import { DynamicButton } from '@/components/ui/dynamic-theme-components'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/context/theme-context'
import { DEFAULT_THEME_TOKENS } from '@/lib/theme-tokens'

import SlideshowManager from './SlideshowManager'

export default function SuperAdminThemePage() {
  const {
    logoType,
    textLogo,

    logoImage: _logoImage,

    setLogoType,
    setTextLogo,
    setLogoImage,
  } = useTheme()
  const { tokens, setTokens } = useThemeSystem()
  const [_logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  // SEO/meta settings
  const [siteTitle, setSiteTitle] = useState('')
  const [siteDescription, setSiteDescription] = useState('')
  const [siteKeywords, setSiteKeywords] = useState('')

  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem('tripfeels-seo-settings')
      if (raw) {
        const parsed = JSON.parse(raw) as {
          title?: string
          description?: string
          keywords?: string
        }
        if (parsed.title) setSiteTitle(parsed.title)
        if (parsed.description) setSiteDescription(parsed.description)
        if (parsed.keywords) setSiteKeywords(parsed.keywords)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
        setLogoImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,
        }),
      })
      if (!res.ok) throw new Error('Failed to save theme')
    } catch (err) {
      console.error('Save theme error:', err)
    }
  }

  const handlePreview = () => {
    window.open('/theme-demo', '_blank')
  }

  // Persist individual SEO fields to localStorage
  const saveSeoField = async (field: 'title' | 'description' | 'keywords') => {
    try {
      const raw = localStorage.getItem('tripfeels-seo-settings')
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
      const next = { ...current }
      if (field === 'title') next.title = siteTitle
      if (field === 'description') next.description = siteDescription
      if (field === 'keywords') next.keywords = siteKeywords
      localStorage.setItem('tripfeels-seo-settings', JSON.stringify(next))
      // Also persist to server via cookies for SSR metadata
      const payload: Record<string, string> = {}
      if (field === 'title') payload.title = siteTitle
      if (field === 'description') payload.description = siteDescription
      if (field === 'keywords') payload.keywords = siteKeywords
      await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      // Refresh to re-read cookies and update <head>
      router.refresh()
    } catch (e) {
      console.error('Failed to save SEO setting', e)
    }
  }

  if (!mounted) {
    return (
      <div className="pt-2 px-2 md:px-3 space-y-5">
        <div className="h-7 w-48 rounded bg-[var(--tf-component-bg)] animate-pulse" />
        <div className="h-32 w-full rounded-lg bg-[var(--tf-component-bg)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="pt-2 px-2 md:px-3 space-y-5">
      <div className="p-4 bg-[var(--tf-component-bg)] backdrop-blur-md rounded-xl border border-[var(--tf-border)] shadow-lg">
        <h1 className="text-2xl font-bold text-[var(--tf-text-primary)]">Theme Management</h1>
        <p className="text-sm text-[var(--tf-text-secondary)] mt-2">
          Customize your application&apos;s appearance, logo, and branding.
        </p>
      </div>

      <Tabs defaultValue="logo" className="space-y-4">
        <TabsList className="!flex !w-full !flex-wrap !gap-1 !h-auto !p-1 rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] shadow-lg">
          <TabsTrigger
            value="logo"
            className="!text-xs md:!text-sm !flex-1 !min-w-[calc(50%-0.125rem)] md:!min-w-0 !px-2 !py-2 data-[state=active]:!bg-[var(--tf-component-bg)]"
          >
            Logo Settings
          </TabsTrigger>
          <TabsTrigger
            value="colors"
            className="!text-xs md:!text-sm !flex-1 !min-w-[calc(50%-0.125rem)] md:!min-w-0 !px-2 !py-2 data-[state=active]:!bg-[var(--tf-component-bg)]"
          >
            Appearance
          </TabsTrigger>
          <TabsTrigger
            value="slideshow"
            className="!text-xs md:!text-sm !flex-1 !min-w-[calc(50%-0.125rem)] md:!min-w-0 !px-2 !py-2 data-[state=active]:!bg-[var(--tf-component-bg)]"
          >
            Slideshow
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="!text-xs md:!text-sm !flex-1 !min-w-[calc(50%-0.125rem)] md:!min-w-0 !px-2 !py-2 data-[state=active]:!bg-[var(--tf-component-bg)]"
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-4">
          <div className="rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] shadow-lg overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[var(--tf-border)]">
              <h2 className="text-lg font-semibold text-[var(--tf-text-primary)] flex items-center gap-2">
                <Type className="h-5 w-5" />
                Logo Configuration
              </h2>
              <p className="text-sm text-[var(--tf-text-secondary)] mt-1">
                Choose between text or image logo for header and sidebar
              </p>
            </div>
            <div className="p-4 md:p-5 space-y-6">
              {/* Logo Type Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Logo Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      logoType === 'text'
                        ? 'border-primary bg-primary/10'
                        : 'border-[var(--tf-border)] hover:border-primary/40'
                    }`}
                    onClick={() => setLogoType('text')}
                  >
                    <div className="flex items-center gap-3">
                      <Type className="h-6 w-6" />
                      <div>
                        <h3 className="font-medium">Text Logo</h3>
                        <p className="text-sm text-[var(--tf-text-secondary)]">
                          Use custom text as logo
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      logoType === 'image'
                        ? 'border-primary bg-primary/10'
                        : 'border-[var(--tf-border)] hover:border-primary/40'
                    }`}
                    onClick={() => setLogoType('image')}
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-6 w-6" />
                      <div>
                        <h3 className="font-medium">Image Logo</h3>
                        <p className="text-sm text-[var(--tf-text-secondary)]">
                          Upload SVG logo (64px × 28px)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background controls removed – background follows selected theme automatically */}

              {/* Text Logo Configuration */}
              {logoType === 'text' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="textLogo">Logo Text</Label>
                    <Input
                      id="textLogo"
                      value={textLogo}
                      onChange={(e) => setTextLogo(e.target.value)}
                      placeholder="Enter logo text"
                      className="mt-1"
                    />
                    <p className="text-sm text-[var(--tf-text-secondary)] mt-1">
                      This text will appear in both header and sidebar
                    </p>
                  </div>

                  {/* Text Logo Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="p-4 border border-[var(--tf-border)] rounded-lg bg-[var(--tf-component-bg)]">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold font-logo text-[var(--tf-text-primary)]">
                          {textLogo}
                        </div>
                        <div className="text-sm text-[var(--tf-text-muted)]">
                          Header Preview
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Logo Configuration */}
              {logoType === 'image' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logoFile">Upload Logo</Label>
                    <div className="mt-1">
                      <Input
                        id="logoFile"
                        type="file"
                        accept=".svg"
                        onChange={handleFileUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                    <p className="text-sm text-[var(--tf-text-secondary)] mt-1">
                      Upload SVG file with dimensions 64px wide × 28px height
                    </p>
                  </div>

                  {/* Image Logo Preview */}
                  {logoPreview && (
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="p-4 border border-[var(--tf-border)] rounded-lg bg-[var(--tf-component-bg)]">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-7 flex items-center justify-center">
                            <NextImage
                              src={logoPreview}
                              alt="Logo Preview"
                              width={64}
                              height={28}
                              className="object-contain"
                            />
                          </div>
                          <div className="text-sm text-[var(--tf-text-muted)]">
                            Header Preview (64px × 28px)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Website Meta Settings */}
              <div className="pt-2 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-[var(--tf-text-primary)]">
                    Website Meta
                  </h3>
                  <p className="text-sm text-[var(--tf-text-secondary)]">
                    Configure basic SEO meta for the site.
                  </p>
                </div>

                {/* Site Title */}
                <div className="space-y-2">
                  <Label htmlFor="siteTitle">Site Title</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      id="siteTitle"
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      placeholder="Enter website title"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => void saveSeoField('title')}
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>

                {/* Site Description */}
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
                    <textarea
                      id="siteDescription"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      placeholder="Enter a concise site description"
                      className="flex-1 min-h-[84px] rounded-md border border-[var(--tf-border)] bg-[var(--tf-input-fill)] text-[var(--tf-text-primary)] placeholder:text-[var(--tf-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => void saveSeoField('description')}
                      className="mt-0.5 inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label htmlFor="siteKeywords">Keywords</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      id="siteKeywords"
                      value={siteKeywords}
                      onChange={(e) => setSiteKeywords(e.target.value)}
                      placeholder="e.g. travel, flights, hotels"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => void saveSeoField('keywords')}
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm border-[hsl(var(--primary))]/60 text-primary hover:bg-primary/10"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-[var(--tf-text-muted)]">Comma separated list.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <DynamicButton
                  variant="primary"
                  onClick={() => void handleSave()}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </DynamicButton>
                <DynamicButton
                  variant="outline"
                  onClick={() => void handlePreview()}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </DynamicButton>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <div className="rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] shadow-lg overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[var(--tf-border)]">
              <h2 className="text-lg font-semibold text-[var(--tf-text-primary)]">Appearance</h2>
              <p className="text-sm text-[var(--tf-text-secondary)] mt-1">
                Edit centralized design tokens from color codes.
              </p>
            </div>
            <div className="p-4 md:p-5 space-y-4">
              <ThemeSelector />

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                  <Label htmlFor="headerBg" className="text-xs font-semibold text-[var(--tf-text-secondary)]">
                    Header Background
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="headerBg-picker"
                      type="color"
                      value={tokens.headerBg}
                      onChange={(e) => setTokens({ headerBg: e.target.value })}
                      className="tf-color-input h-9 w-10 rounded border border-[var(--tf-border)] bg-[var(--tf-input-fill)] p-1"
                    />
                    <Input
                      id="headerBg"
                      value={tokens.headerBg}
                      onChange={(e) => setTokens({ headerBg: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                  <Label htmlFor="sidebarBg" className="text-xs font-semibold text-[var(--tf-text-secondary)]">
                    Sidebar Background
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="sidebarBg-picker"
                      type="color"
                      value={tokens.sidebarBg}
                      onChange={(e) => setTokens({ sidebarBg: e.target.value })}
                      className="tf-color-input h-9 w-10 rounded border border-[var(--tf-border)] bg-[var(--tf-input-fill)] p-1"
                    />
                    <Input
                      id="sidebarBg"
                      value={tokens.sidebarBg}
                      onChange={(e) => setTokens({ sidebarBg: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                  <Label htmlFor="footerBg" className="text-xs font-semibold text-[var(--tf-text-secondary)]">
                    Footer Background
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="footerBg-picker"
                      type="color"
                      value={tokens.footerBg}
                      onChange={(e) => setTokens({ footerBg: e.target.value })}
                      className="tf-color-input h-9 w-10 rounded border border-[var(--tf-border)] bg-[var(--tf-input-fill)] p-1"
                    />
                    <Input
                      id="footerBg"
                      value={tokens.footerBg}
                      onChange={(e) => setTokens({ footerBg: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--tf-border)] bg-[var(--tf-component-bg)] px-2.5 py-2">
                  <Label htmlFor="divider" className="text-xs font-semibold text-[var(--tf-text-secondary)]">
                    Divider Color
                  </Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="divider-picker"
                      type="color"
                      value={tokens.divider}
                      onChange={(e) => setTokens({ divider: e.target.value })}
                      className="tf-color-input h-9 w-10 rounded border border-[var(--tf-border)] bg-[var(--tf-input-fill)] p-1"
                    />
                    <Input
                      id="divider"
                      value={tokens.divider}
                      onChange={(e) => setTokens({ divider: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setTokens(DEFAULT_THEME_TOKENS)}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex w-full items-center justify-end gap-3 px-4 md:px-5 pb-4 md:pb-5">
              <DynamicButton
                variant="primary"
                onClick={() => void handleSave()}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Apply Theme
              </DynamicButton>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="slideshow" className="space-y-4">
          <div className="rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] shadow-lg overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[var(--tf-border)]">
              <h2 className="text-lg font-semibold text-[var(--tf-text-primary)]">
                Auth Slideshow
              </h2>
              <p className="text-sm text-[var(--tf-text-secondary)] mt-1">
                Manage images for the left-side slideshow on the auth page
              </p>
            </div>
            <div className="p-4 md:p-5 space-y-6">
              <SlideshowManager />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="rounded-xl border border-[var(--tf-border)] bg-[var(--tf-component-bg)] shadow-lg overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[var(--tf-border)]">
              <h2 className="text-lg font-semibold text-[var(--tf-text-primary)]">
                Theme Preview
              </h2>
              <p className="text-sm text-[var(--tf-text-secondary)] mt-1">
                Preview your theme changes before applying
              </p>
            </div>
            <div className="p-4 md:p-5">
              <p className="text-[var(--tf-text-secondary)]">
                Theme preview will be implemented here.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
