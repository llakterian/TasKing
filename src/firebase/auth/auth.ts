'use client';

import {
    signOut as firebaseSignOut,
    onAuthStateChanged as onFirebaseAuthStateChanged,
    signInWithCustomToken,
    type Auth,
    type User
} from 'firebase/auth';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { BrowserProvider } from "ethers";
import { verifyEVMWallet } from '@/ai/flows/verify-evm-wallet';

const createUserProfile = async (firestore: Firestore, user: User) => {
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        const { uid, displayName, email, photoURL } = user;
        const profileData: { uid: string, name: string | null, email?: string | null, avatarUrl: string | null } = {
            uid,
            name: displayName,
            email,
            avatarUrl: photoURL,
        };

        // For EVM wallets, the user object might not have display name, email, etc.
        // We use the address as a fallback name.
        if (!profileData.name) {
            profileData.name = user.uid;
        }

        await setDoc(userRef, profileData);
    }
}

export const signInWithEVMWallet = async (auth: Auth, firestore: Firestore, injectedProvider?: any) => {
    try {
        const ethereum = injectedProvider || (window as any).ethereum;

        if (!ethereum) {
            alert('Please install MetaMask or another EVM wallet provider.');
            return;
        }

        const provider = new BrowserProvider(ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const message = `Welcome to TasKing! Please sign this message to log in. Nonce: ${Date.now()}`;
        const signature = await signer.signMessage(message);

        const { customToken } = await verifyEVMWallet({ address, message, signature });

        if (customToken) {
            const userCredential = await signInWithCustomToken(auth, customToken);
            await createUserProfile(firestore, userCredential.user);
        } else {
            throw new Error("Could not get a valid custom token from the backend.");
        }

    } catch (error: any) {
        console.error("EVM Wallet sign-in error", {
            message: error.message,
            code: error.code,
            customTokenLength: error.customToken?.length || 'N/A'
        });
        alert(`An error occurred during wallet sign-in: ${error.message || 'See console for details.'}`);
    }
};

export function onAuthStateChanged(auth: Auth | null, callback: (user: User | null) => void) {
    if (!auth) {
        callback(null);
        return () => { };
    };
    return onFirebaseAuthStateChanged(auth, callback);
}

export const signOut = (auth: Auth) => {
    if (!auth) return;
    return firebaseSignOut(auth);
}
