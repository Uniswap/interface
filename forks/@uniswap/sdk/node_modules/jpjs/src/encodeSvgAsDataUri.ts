/**
 * Safely encode an SVG for usage as a placeholder
 * @see https://codepen.io/tigt/post/optimizing-svgs-in-data-uris
 *
 * @param svgString An svg
 */
export function encodeSVGAsDataUri(svgString: string) {
  // Possible improvements:
  //   * Lowercase the hex-escapes for better gzipping
  //   * Replace stuff like `fill="%23000"` with `fill="black"`
  var uriPayload = encodeURIComponent(svgString) // encode URL-unsafe characters
    .replace(/%0A/g, '') // remove newlines
    .replace(/%20/g, ' ') // put spaces back in
    .replace(/%3D/g, '=') // ditto equals signs
    .replace(/%3A/g, ':') // ditto colons
    .replace(/%2F/g, '/') // ditto slashes
    // tslint:disable-next-line:quotemark
    .replace(/%22/g, "'"); // replace quotes with apostrophes (may break certain SVGs)

  return 'data:image/svg+xml,' + uriPayload;
}
