// src/lib/crypto.ts

/**
 * Generates a secure, random cryptographic key for AES-GCM encryption
 */
export const generateRoomKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
};

/**
 * Converts a CryptoKey to a string so you can share/store it safely
 */
export const exportKeyToString = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

/**
 * Converts a stored string back into a usable CryptoKey object
 */
export const importKeyFromString = async (keyStr: string): Promise<CryptoKey> => {
  const rawKey = Uint8Array.from(atob(keyStr), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypts a plaintext string
 * Returns an object containing the ciphertext and the unique initialization vector (IV)
 */
export const encryptMessage = async (
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> => {
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plaintext);
  
  // IV must be unique for every single message to keep AES-GCM secure
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
  };
};

/**
 * Decrypts an incoming message using the matching IV
 */
export const decryptMessage = async (
  ciphertext: string,
  ivStr: string,
  key: CryptoKey
): Promise<string> => {
  const cipherBuffer = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

// 💡 Add this helper to your src/lib/crypto.ts file
export async function generateRandomRoomKeyString(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
  
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}