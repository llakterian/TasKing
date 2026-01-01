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
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully with credentials.');
    } catch (e: any) {
      console.error('Error initializing Firebase Admin with credentials:', e.message);
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
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature verification failed: Recovered address does not match provided address.');
      }

      const customToken = await admin.auth().createCustomToken(address);

      return { customToken };

    } catch (error: any) {
      console.error('EVM Wallet verification error:', error.message);
      // It's better to throw a more specific error or handle it gracefully
      // For now, re-throwing the original error message.
      throw new Error(`Failed to verify EVM wallet signature: ${error.message}`);
    }
  }
);
