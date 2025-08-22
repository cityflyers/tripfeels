import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Add this type at the top of the file
type FirebaseConfigKey = keyof typeof firebaseConfig;

// Add explicit type checking for environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Then update the validation function
const validateConfig = () => {
  const requiredFields: FirebaseConfigKey[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field] || firebaseConfig[field] === 'your-api-key-here' || firebaseConfig[field] === 'your-project-id' || firebaseConfig[field] === 'your-project-id.firebaseapp.com' || firebaseConfig[field] === 'your-project-id.appspot.com' || firebaseConfig[field] === 'your-messaging-sender-id' || firebaseConfig[field] === 'your-app-id');
  
  if (missingFields.length > 0) {
    console.warn(`Firebase config not properly set up. Missing or placeholder values for: ${missingFields.join(', ')}`);
    console.warn('Please update your .env.local file with actual Firebase configuration values.');
    return false;
  }
  return true;
};

// Initialize Firebase with validation
let app: FirebaseApp;
let auth: any = null;
let db: any = null;

try {
  const isConfigValid = validateConfig();
  
  if (!isConfigValid) {
    console.warn('Firebase initialization skipped due to missing configuration');
    // Create mock objects to prevent app crashes
    app = {} as FirebaseApp;
  } else {
  console.log('Initializing Firebase with config:', {
    ...firebaseConfig,
    apiKey: '**hidden**'
  });
  
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    app = getApp();
    console.log('Using existing Firebase app');
  }
    
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Don't throw error, just log it and create mock objects
  app = {} as FirebaseApp;
}

export { app, auth, db };