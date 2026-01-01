// This file is intentionally left blank. 
// The Firebase configuration will be populated by the backend.
//
// Note: do not export a variable named 'firebaseConfig'.
// Instead, export a function that returns the config object.

export function getFirebaseConfig() {
  return {
    "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "measurementId": process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
    "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  };
}
