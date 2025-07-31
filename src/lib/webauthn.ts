// WebAuthn utility functions for biometric authentication

export const isBiometricSupported = () => {
  return window.PublicKeyCredential !== undefined;
};

// Store credential ID in localStorage for each user
const getCredentialKey = (userId: string) => `soulspect_biometric_${userId}`;

export const setupBiometric = async (userId: string, userEmail: string) => {
  if (!isBiometricSupported()) {
    throw new Error("Biometric authentication not supported");
  }

  try {
    // Create challenge (in production, get this from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Soulspect",
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail,
        displayName: userEmail.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "direct",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to create credential");
    }

    // Store credential ID for future authentication
    const rawIdArray = new Uint8Array(credential.rawId);
    const rawIdStr = Array.from(rawIdArray).map(b => String.fromCharCode(b)).join('');
    const credentialId = btoa(rawIdStr);
    localStorage.setItem(getCredentialKey(userId), credentialId);

    return credentialId;
  } catch (error: any) {
    console.error("Biometric setup error:", error);
    throw error;
  }
};

export const authenticateWithBiometric = async (userId: string): Promise<boolean> => {
  if (!isBiometricSupported()) {
    throw new Error("Biometric authentication not supported");
  }

  const storedCredentialId = localStorage.getItem(getCredentialKey(userId));
  if (!storedCredentialId) {
    throw new Error("No biometric credential found. Please set up biometric authentication first.");
  }

  try {
    // Create challenge (in production, get this from server)
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Convert stored credential ID back to ArrayBuffer
    const credentialId = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: credentialId,
        type: "public-key",
        transports: ["internal"],
      }],
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return false;
    }

    // In production, verify assertion on server
    // For now, if we got here, biometric auth succeeded
    return true;
  } catch (error: any) {
    console.error("Biometric authentication error:", error);
    
    // If user cancels or biometric fails, return false
    if (error.name === "NotAllowedError" || error.name === "AbortError") {
      return false;
    }
    
    throw error;
  }
};

export const removeBiometric = (userId: string) => {
  localStorage.removeItem(getCredentialKey(userId));
};

export const hasBiometricSetup = (userId: string): boolean => {
  return localStorage.getItem(getCredentialKey(userId)) !== null;
};