export function hasURL(str: string): boolean {
  const pattern = new RegExp(
    '(http|https):\\/\\/' + // Match either "http" or "https" for the protocol
      '(\\w+:{0,1}\\w*)?' + // Allow for an optional username and password in the URL
      '(\\S+)' + // Match the domain name or IP address
      '(:[0-9]+)?' + // Allow for an optional port number in the URL
      '(\\/|\\/([\\w#!:.?+=&%!\\-\\/]))?' // Allow for an optional path and query string in the URL
  )

  return pattern.test(str)
}
