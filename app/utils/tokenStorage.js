const TOKEN_KEY = 'timatic.token'
const SIGNED_OUT_KEY = 'timatic.signedOut'

/**
 * The bearer token lives in localStorage rather than in an HttpOnly cookie, which is the trade the
 * api made when it stopped accepting the session: injected script can read it, but cross site
 * request forgery stops being reachable at all. Keep the token short lived and revoke it on logout.
 */
export function readToken () {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function writeToken (token) {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.removeItem(SIGNED_OUT_KEY)
}

export function clearToken () {
  window.localStorage.removeItem(TOKEN_KEY)
}

/**
 * Remembers that the visitor left on purpose. The identity provider keeps a session of its own that
 * Timatic cannot end, so without this marker signing out and opening the app again would sign them
 * straight back in without a screen ever appearing.
 */
export function markSignedOut () {
  window.localStorage.setItem(SIGNED_OUT_KEY, '1')
}

export function hasSignedOut () {
  return window.localStorage.getItem(SIGNED_OUT_KEY) !== null
}
