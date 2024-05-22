import { t } from 'i18n'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MetaTagInjectorInput } from 'shared-cloud/metatags'

const DEFAULT_METATAGS: MetaTagInjectorInput = {
  title: t`Uniswap Interface`,
  description: t`Swap or provide liquidity on the Uniswap Protocol`,
  image: `https://app.uniswap.com/images/1200x630_Rich_Link_Preview_Image.png`,
  url: 'https://app.uniswap.com',
}

/**
 * Metatags are already injected server-side for SEO/crawlers. We also want
 * to dynamically update metatags as user navigates. (Safari's native share
 * function uses the page's metatag og:url as opposed to actual URL.)
 *
 * See `functions/README.md` for more info.
 */
export function useMetatags(metaTags: MetaTagInjectorInput = DEFAULT_METATAGS) {
  const [metaTagAttributes, setMetaTagAttributes] = useState<{ attribute: string; content: string }[]>([])
  const location = useLocation()
  useEffect(() => {
    metaTags.url = window.location.href
    const attributes = [
      { attribute: 'property="og:title"', content: metaTags.title },
      { attribute: 'property="og:url"', content: metaTags.url },
      { attribute: 'property="twitter:title"', content: metaTags.title },
    ]
    if (metaTags.description) {
      attributes.push(
        { attribute: 'property="og:description"', content: metaTags.description },
        { attribute: 'name="description"', content: metaTags.description }
      )
    }
    if (metaTags.image) {
      attributes.push(
        { attribute: 'property="og:image"', content: metaTags.image },
        { attribute: 'property="og:image:alt"', content: metaTags.title },
        { attribute: 'property="twitter:image"', content: metaTags.image },
        { attribute: 'property="twitter:image:alt"', content: metaTags.title }
      )
    }
    setMetaTagAttributes(attributes)
  }, [metaTags, location])

  return metaTagAttributes
}
