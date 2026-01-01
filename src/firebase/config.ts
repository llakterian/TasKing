// This file is intentionally left blank. 
// The Firebase configuration will be populated by the backend.
//
// Note: do not export a variable named 'firebaseConfig'.
// Instead, export a function that returns the config object.

export function getFirebaseConfig() {
  const config = {
    "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "measurementId": process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
    "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  };

  // Client-side diagnostics (Visible in browser console)
  console.log('Firebase Client Diagnostics:', {
    hasProjectId: !!config.projectId,
    hasAppId: !!config.appId,
    hasApiKey: !!config.apiKey,
    hasAuthDomain: !!config.authDomain,
    authDomainValue: config.authDomain, // Safe to log public domain
    apiKeyLength: config.apiKey?.length || 0,
  });

  const missingVars = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'measurementId')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('CRITICAL: Missing Firebase Client environment variables:', missingVars.join(', '));
  }

  return config;
}
