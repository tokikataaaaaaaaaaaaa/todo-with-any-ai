import { initializeApp, getApps, getApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK (only once)
const app = getApps().length === 0 ? initializeApp() : getApp()

export const db = getFirestore(app)
