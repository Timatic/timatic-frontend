/**
 * The api lives on the api subdomain of whatever host serves this frontend, which is what keeps
 * the two on one registrable domain.
 */
export function apiBaseUrl () {
  return 'https://api.' + document.location.hostname
}
