/**
 * Proof Key for Code Exchange. The verifier never leaves this browser until the token exchange, so
 * a stolen authorization code is worthless on its own.
 */
export function randomString (bytes) {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function challengeFor (codeVerifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))

  return base64Url(new Uint8Array(digest))
}

function base64Url (bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
