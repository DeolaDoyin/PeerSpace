// src/lib/crypto.ts

/**
 * High-performance, memory-safe conversion from Uint8Array to a Base64 string.
 * Avoids call-stack overflows caused by using the spread operator on large arrays.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * High-performance, memory-safe conversion from a Base64 string to a Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Extracts the exact underlying ArrayBuffer window from a typed array view.
 * This guarantees Web Crypto won't read trailing garbage padding memory bytes.
 */
function getPureBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

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
 * Converts a CryptoKey to a base64 string so you can share/store it safely
 */
export const exportKeyToString = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return uint8ArrayToBase64(new Uint8Array(exported));
};

/**
 * Converts a stored string back into a usable CryptoKey object
 */
export const importKeyFromString = async (keyStr: string): Promise<CryptoKey> => {
  const rawKey = base64ToUint8Array(keyStr);
  return await window.crypto.subtle.importKey(
    "raw",
    getPureBuffer(rawKey),
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
      iv: getPureBuffer(iv),
    },
    key,
    getPureBuffer(encodedText)
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    iv: uint8ArrayToBase64(iv),
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
  const cipherBuffer = base64ToUint8Array(ciphertext);
  const iv = base64ToUint8Array(ivStr);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: getPureBuffer(iv),
    },
    key,
    getPureBuffer(cipherBuffer)
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

/**
 * Helper to auto-generate encryption room strings safely
 */
export async function generateRandomRoomKeyString(): Promise<string> {
  const key = await generateRoomKey();
  return await exportKeyToString(key);
}