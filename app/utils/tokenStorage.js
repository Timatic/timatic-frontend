const TOKEN_KEY = 'timatic.token'

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
}

export function clearToken () {
  window.localStorage.removeItem(TOKEN_KEY)
}
