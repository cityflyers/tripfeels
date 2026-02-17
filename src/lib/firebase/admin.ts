import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

import { serverEnv } from '@/lib/env.server'

import type { ServiceAccount } from 'firebase-admin/app'

// Helper function to properly parse Firebase private key
const parsePrivateKey = (key: string): string => {
  if (!key) return ''
  // Handle various escape formats that might come from environment variables
  let parsed = key
  // First, replace escaped newlines \\n with actual newlines
  parsed = parsed.replace(/\\n/g, '\n')
  // Handle escaped quotes
  parsed = parsed.replace(/\\"/g, '"')
  // Remove any accidental extra escaping that might cause issues
  // Ensure it starts with the correct PEM header
  if (!parsed.includes('-----BEGIN PRIVATE KEY-----')) {
    console.warn('[Firebase Admin] Private key does not contain expected PEM header')
  }
  return parsed
}

const firebaseAdminConfig = {
  projectId: serverEnv.FIREBASE_PROJECT_ID,
  clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
  privateKey: parsePrivateKey(serverEnv.FIREBASE_PRIVATE_KEY),
}

// Initialize Firebase Admin
// Build a strongly-typed ServiceAccount for typing, using dev-safe fallbacks.
const serviceAccount: ServiceAccount = {
  projectId: firebaseAdminConfig.projectId || '',
  clientEmail: firebaseAdminConfig.clientEmail || '',
  privateKey: firebaseAdminConfig.privateKey || '',
}

let app: any

try {
  app =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
          ...(serverEnv.FIREBASE_PROJECT_ID ? { projectId: serverEnv.FIREBASE_PROJECT_ID } : {}),
        })
      : getApp()
} catch (error) {
  console.error('[Firebase Admin] Initialization error:', error)
  // Create a minimal fallback app for error recovery
  const errorMsg = error instanceof Error ? error.message : String(error)
  console.error(`[Firebase Admin] Details: ${errorMsg}`)
  throw error
}

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
export default app
