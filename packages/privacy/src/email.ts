/**
 * Email truncation utility for privacy-preserving display.
 *
 * Shows first character + asterisks + last character of local part,
 * keeps full domain for recognition.
 *
 * @example
 * truncateEmail("john.doe@gmail.com") // "j***e@gmail.com"
 * truncateEmail("ab@company.org")     // "a*@company.org"
 * truncateEmail("x@test.com")         // "x*@test.com"
 */
export function truncateEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '***@***'
  }

  const atIndex = email.indexOf('@')
  if (atIndex === -1) {
    return '***@***'
  }

  const localPart = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)

  if (!localPart || !domain) {
    return '***@***'
  }

  // Truncate local part: show first char + asterisks + last char (if > 2 chars)
  let truncatedLocal: string
  if (localPart.length <= 1) {
    truncatedLocal = localPart + '*'
  } else if (localPart.length === 2) {
    truncatedLocal = localPart[0] + '*'
  } else {
    truncatedLocal = localPart[0] + '***' + localPart[localPart.length - 1]
  }

  return `${truncatedLocal}@${domain}`
}
