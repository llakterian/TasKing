'use server';

/**
 * @fileOverview This file defines a Genkit flow to verify an EVM wallet signature and generate a custom auth token.
 *
 * - verifyEVMWallet - The main function that triggers the verification and token generation.
 * - VerifyEVMWalletInput - The input type for the verifyEVMWallet function.
 * - VerifyEVMWalletOutput - The return type for the verifyEVMWallet function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ethers } from 'ethers';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // 1. Incredibly robust cleaning
    privateKey = privateKey.trim();

    // Handle surrounding quotes
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1).trim();
    }

    // Replace literal \n or escaped \n
    privateKey = privateKey.replace(/\\n/g, '\n');
    privateKey = privateKey.replace(/\\r/g, '\r');

    // Ensure header/footer formatting - sometimes users copy without them or they get mangled
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') && privateKey.includes('-----END PRIVATE KEY-----')) {
      console.warn('PEM Header missing but footer present. Attempting reconstruction.');
      // Find where the key content likely starts (after any random characters)
      // Or just prepend it if it's missing entirely.
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      // Diagnostic logging (Safer: doesn't show key content, just structure)
      const first5 = privateKey.substring(0, 5).split('').map(c => c.charCodeAt(0)).join(',');
      console.log('Firebase Admin Diagnostics:', {
        keyLength: privateKey.length,
        hasHeaderStrict: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
        hasFooterStrict: privateKey.includes('-----END PRIVATE KEY-----'),
        first5CharCodes: first5,
        projectIdLabel: projectId.substring(0, 5) + '...',
      });

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully.');
    } catch (e: any) {
      console.error('Error initializing Firebase Admin:', e.message);
    }
  } else {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    console.warn(`Firebase Admin: Missing credentials (${missing.join(', ')}). Falling back to applicationDefault().`);

    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e: any) {
      console.error('Error initializing Firebase Admin with applicationDefault:', e.message);
    }
  }
}


const VerifyEVMWalletInputSchema = z.object({
  address: z.string().describe('The EVM wallet address.'),
  message: z.string().describe('The message that was signed.'),
  signature: z.string().describe('The signature to verify.'),
});

export type VerifyEVMWalletInput = z.infer<typeof VerifyEVMWalletInputSchema>;

const VerifyEVMWalletOutputSchema = z.object({
  customToken: z.string().describe('The custom Firebase authentication token.'),
});

export type VerifyEVMWalletOutput = z.infer<typeof VerifyEVMWalletOutputSchema>;


export async function verifyEVMWallet(input: VerifyEVMWalletInput): Promise<VerifyEVMWalletOutput> {
  return verifyEVMWalletFlow(input);
}


const verifyEVMWalletFlow = ai.defineFlow(
  {
    name: 'verifyEVMWalletFlow',
    inputSchema: VerifyEVMWalletInputSchema,
    outputSchema: VerifyEVMWalletOutputSchema,
  },
  async ({ address, message, signature }) => {
    try {
      console.log('verifyEVMWalletFlow: Starting verification for address:', address);

      // Genkit API Key Check
      const hasAIKey = !!(process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
      console.log('verifyEVMWalletFlow: Genkit API Key present:', hasAIKey);

      const recoveredAddress = ethers.verifyMessage(message, signature);
      console.log('verifyEVMWalletFlow: Recovered address:', recoveredAddress);

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        console.error('verifyEVMWalletFlow: Address mismatch!', { provided: address, recovered: recoveredAddress });
        throw new Error('Signature verification failed: Recovered address does not match provided address.');
      }

      console.log('verifyEVMWalletFlow: Attempting to create custom token...');
      const customToken = await admin.auth().createCustomToken(address);
      console.log('verifyEVMWalletFlow: Custom token created successfully.');

      return { customToken };

    } catch (error: any) {
      console.error('verifyEVMWalletFlow: Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw new Error(`Failed to verify EVM wallet signature: ${error.message}`);
    }
  }
);
