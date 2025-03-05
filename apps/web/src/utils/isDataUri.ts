/**
 * Returns true if the string is a RFC2397-compliant data URI
 * @see {@link https://www.rfc-editor.org/rfc/rfc2397}
 */
export default function isDataURI(uri: string): boolean {
  return /data:(image\/(?:\w|-)+)(;?\w+=[\w-]+)*(;base64)?,.*/gu.test(uri)
}
