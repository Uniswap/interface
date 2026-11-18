/**
 * The IP from CloudFront's `cloudfront-viewer-address` header, which carries `IP:port`.
 * The port always follows the final colon for both address families (IPv6 is not
 * bracketed), so everything before it is the address. Dropping the port keeps one
 * client in one rate-limit bucket rather than one per connection.
 */
export function stripCloudFrontViewerPort(viewerAddress: string): string {
  const portColon = viewerAddress.lastIndexOf(':')
  return portColon === -1 ? viewerAddress : viewerAddress.slice(0, portColon)
}
