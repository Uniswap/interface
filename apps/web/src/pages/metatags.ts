import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { MetaTagInjectorInput } from 'shared-cloud/metatags'
import i18n from 'uniswap/src/i18n'

const DEFAULT_METATAGS: MetaTagInjectorInput = {
  title: i18n.t('interface.metatags.title'),
  description: i18n.t('interface.metatags.description'),
  image: `https://ring.exchange/images/1200x630_Rich_Link_Preview_Image.png`,
  url: 'https://ring.exchange',
}

type MetatagAttributes = { property?: string; name?: string; content: string }

/**
 * Metatags are already injected server-side for SEO/crawlers. We also want
 * to dynamically update metatags as user navigates. (Safari's native share
 * function uses the page's metatag og:url as opposed to actual URL.)
 *
 * See `functions/README.md` for more info.
 */
export function useDynamicMetatags(metaTags: MetaTagInjectorInput = DEFAULT_METATAGS) {
  const location = useLocation()

  return useMemo(() => {
    const url = `${window.location.origin}${location.pathname}${location.search}${location.hash}`
    const attributes: MetatagAttributes[] = [
      { property: 'og:title', content: metaTags.title },
      { property: 'og:url', content: url },
      { property: 'twitter:title', content: metaTags.title },
    ]
    if (metaTags.description) {
      attributes.push(
        { property: 'og:description', content: metaTags.description },
        { name: 'description', content: metaTags.description },
      )
    }
    if (metaTags.image) {
      attributes.push(
        { property: 'og:image', content: metaTags.image },
        { property: 'og:image:alt', content: metaTags.title },
        { property: 'twitter:image', content: metaTags.image },
        { property: 'twitter:image:alt', content: metaTags.title },
      )
    }
    return attributes
  }, [location.hash, location.pathname, location.search, metaTags.description, metaTags.image, metaTags.title])
}
