import type { JSX } from 'react'
import { isSVGUri, uriToHttpUrls } from 'utilities/src/format/urls'
import type { UniversalImageProps } from '../types'

/**
 * jsdom stand-in for `UniversalImage`, for suites that render a consumer tree but
 * do not want the real component's image pipeline (SVG fetch, load/error state,
 * platform-split leaves) running inside them.
 *
 * Lives with the component rather than in a consumer package because
 * `UniversalImage` is exported from BOTH the `@universe/mycelium` barrel and the
 * `@universe/mycelium/universal-image` subpath: a `vi.mock` keyed to only one of
 * those leaves the other rendering the real component, and the census tooling
 * cannot see mock specifiers, so that gap fails silently behind a green suite.
 * Consumers mock both entrypoints against this single implementation, reached
 * through the `@universe/mycelium/universal-image/testing` export.
 *
 * The branch it DOES reproduce faithfully is the testID contract, because that is
 * what consumers select on: the real component stamps `img-`/`svg-`/`loading-`
 * prefixes per branch, never the raw testID, so a mock that stamped the raw one
 * would make `getByTestId('img-x')` find nothing and quietly bless consumer
 * selectors that the real DOM would never satisfy. Picking the prefix needs only
 * the same two pure url helpers the real component branches on — no fetch, no load
 * state — so the mock branches on them too.
 *
 * What it deliberately does NOT reproduce: the leaf DOM below the prefixed
 * container (the real svg leg nests a second wrapper the mock flattens), the
 * loader element inside the loading container, and the require-source (numeric
 * uri) leg, which resolves to a blank sized block on web. Only the prefixed
 * container and the `<img>` beneath it are contractual here.
 */
export function UniversalImage({
  alt,
  uri,
  style,
  fallback,
  testID,
  allowLocalUri = false,
}: Pick<UniversalImageProps, 'alt' | 'uri' | 'style' | 'fallback' | 'testID' | 'allowLocalUri'>): JSX.Element | null {
  // Numeric ids are require-source assets; the real component routes them to
  // RequireImage, whose web leg paints a blank sized block and stamps no testID.
  // It ignores `fallback` entirely (it performs no load, so the error path cannot
  // fire), so returning one here would bless a fallback the real web DOM never
  // renders. Nothing under this branch is contractual, hence the flattened null.
  if (typeof uri === 'number') {
    return null
  }

  if (!uri) {
    // Ordering matches the real component: a fallback wins over the loading container.
    if (fallback) {
      return fallback
    }
    if (style?.loadingContainer) {
      // oxlint-disable-next-line react/forbid-elements -- jsdom test double; stays a plain div
      return <div data-testid={testID ? `loading-${testID}` : undefined} />
    }
    return null
  }

  const imageHttpUrl = uriToHttpUrls(uri, { allowLocalUri })[0]
  if (!imageHttpUrl) {
    return fallback ?? null
  }

  const prefix = isSVGUri(imageHttpUrl) ? 'svg' : 'img'
  return (
    // oxlint-disable-next-line react/forbid-elements -- jsdom test double; stays a plain div
    <div data-testid={testID ? `${prefix}-${testID}` : undefined}>
      <img alt={alt} src={imageHttpUrl} />
    </div>
  )
}
