import { initializeApp, type FirebaseApp } from 'firebase/app'

function readFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  }
}

export const firebaseConfig = readFirebaseConfig()
export const isFirebaseConfigured = firebaseConfig != null

export const firebaseApp: FirebaseApp | null = firebaseConfig
  ? initializeApp(firebaseConfig)
  : null

export const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? ''
