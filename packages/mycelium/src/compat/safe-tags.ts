/**
 * Elements a compat primitive may render via `tag`. Never add anything that can load or run a
 * resource (script, svg, math, iframe, object, embed, img, form, input, link, base, style, meta):
 * `tag` and `href` can arrive from untrusted markup when react-i18next `<Trans>` merges parsed
 * attributes onto a mapped component. Unknown tags render as `div`.
 */
export const SAFE_COMPAT_TAGS = [
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'b',
  'bdi',
  'bdo',
  'blockquote',
  'br',
  'button',
  'caption',
  'cite',
  'code',
  'data',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'i',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'main',
  'mark',
  'nav',
  'ol',
  'output',
  'p',
  'pre',
  'q',
  's',
  'samp',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
  'var',
  'wbr',
] as const

export type SafeCompatTag = (typeof SAFE_COMPAT_TAGS)[number]

const SAFE_COMPAT_TAG_SET: ReadonlySet<string> = new Set(SAFE_COMPAT_TAGS)

// Link props only mean something on <a>; anywhere else they are a smuggled resource reference.
const ANCHOR_ONLY_DOM_PROPS = ['href', 'target', 'rel', 'download'] as const

const SAFE_HREF_SCHEMES = new Set(['http', 'https', 'mailto'])

// Browsers strip tab/newline before parsing a URL, so `java\nscript:` is still `javascript:`.
function isSafeHref(href: unknown): boolean {
  if (typeof href !== 'string') {
    return false
  }
  const scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(href.replace(/[\t\n\r]/g, ''))?.[1]
  return scheme === undefined || SAFE_HREF_SCHEMES.has(scheme.toLowerCase())
}

/**
 * Resolves the element to render and contains link props in place: dropped entirely unless the
 * element is an anchor, and `href` dropped on an anchor unless it is relative, http(s) or mailto.
 */
export function containUntrustedTag(
  tag: string | undefined,
  forwardedDomProps: Record<string, unknown>,
): SafeCompatTag {
  const resolvedTag: SafeCompatTag = tag !== undefined && SAFE_COMPAT_TAG_SET.has(tag) ? (tag as SafeCompatTag) : 'div'
  if (resolvedTag !== 'a') {
    for (const anchorProp of ANCHOR_ONLY_DOM_PROPS) {
      delete forwardedDomProps[anchorProp]
    }
  } else if ('href' in forwardedDomProps && !isSafeHref(forwardedDomProps['href'])) {
    delete forwardedDomProps['href']
  }
  return resolvedTag
}
