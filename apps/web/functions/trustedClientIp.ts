/**
 * The real client IP, as seen by the proxies in front of this server (CloudFront → ALB).
 * Clients can send any header they like, so only headers those proxies set are trusted:
 * CloudFront's `cloudfront-viewer-address` ("IP:port") when it is forwarded, else the
 * last `x-forwarded-for` entry, which the ALB appends from the TCP connection itself.
 */
export function resolveTrustedClientIp(header: (name: string) => string | undefined): string | undefined {
  const viewerAddress = header('cloudfront-viewer-address')
  if (viewerAddress) {
    // The port always follows the final colon, for IPv4 and IPv6 alike.
    const portColon = viewerAddress.lastIndexOf(':')
    return portColon === -1 ? viewerAddress : viewerAddress.slice(0, portColon)
  }
  const xff = header('x-forwarded-for')
  if (xff) {
    return xff.split(',').at(-1)?.trim() || undefined
  }
  return undefined
}
