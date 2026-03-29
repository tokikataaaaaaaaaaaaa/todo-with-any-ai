import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GithubAuthProvider, GoogleAuthProvider, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) {
    return null
  }
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
}

function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp()
  if (!app) return null
  return getAuth(app)
}

export const auth = getFirebaseAuth()
export const githubProvider = new GithubAuthProvider()
export const googleProvider = new GoogleAuthProvider()
