import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'
import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_TOKENS,
  sanitizeThemeTokens,
} from '@/lib/theme-tokens'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as never)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userObj =
      typeof session === 'object' && 'user' in session
        ? (session as { user?: Record<string, unknown> }).user
        : undefined
    const role = (userObj && typeof userObj.role === 'string' ? userObj.role : undefined) || 'User'
    if (role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const raw: unknown = await req.json()
    const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

    const tokens = sanitizeThemeTokens(body.tokens)
    const mode = DEFAULT_THEME_MODE

    const payload = {
      tokens,
      mode,
      updatedAt: new Date(),
      updatedBy: userObj && typeof userObj.id === 'string' ? userObj.id : undefined,
    }

    // Keep legacy fields for old clients that still read them.
    const legacy = {
      colorTheme: 'custom',
      bgStyle: 'solid',
      solidColor: tokens.appBg || DEFAULT_THEME_TOKENS.appBg,
      gradientFrom: tokens.appBg || DEFAULT_THEME_TOKENS.appBg,
      gradientVia: tokens.surface || DEFAULT_THEME_TOKENS.surface,
      gradientTo: tokens.surfaceAlt || DEFAULT_THEME_TOKENS.surfaceAlt,
    }

    await adminDb.collection('themes').doc('global').set({ ...payload, ...legacy }, { merge: true })

    return NextResponse.json({ ok: true, theme: payload })
  } catch (error) {
    console.error('POST /api/theme error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
