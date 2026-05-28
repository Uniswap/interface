import { MetaTagInjectorInput } from 'shared-cloud/metatags'

/**
 * Listener class for Cloudflare's HTMLRewriter {@link https://developers.cloudflare.com/workers/runtime-apis/html-rewriter}
 * to inject meta tags into the <head> of an HTML document.
 */
export class MetaTagInjector implements HTMLRewriterElementContentHandlers {
  static SELECTOR = 'head'

  constructor(
    private input: MetaTagInjectorInput,
    private request: Request,
  ) {}

  append(element: Element, attribute: string, content: string) {
    // without adding data-rh="true", react-helmet-async doesn't overwrite existing metatags
    element.append(`<meta ${attribute} content="${content}" data-rh="true">`, { html: true })
  }

  appendProperty(element: Element, property: string, content: string) {
    this.append(element, `property="${property}"`, content)
  }

  element(element: Element) {
    if (this.input.description) {
      this.append(element, `name="description"`, this.input.description)
    }

    //Open Graph Tags
    this.appendProperty(element, 'og:title', this.input.title)
    if (this.input.description) {
      this.appendProperty(element, 'og:description', this.input.description)
    }
    if (this.input.image) {
      this.appendProperty(element, 'og:image', this.input.image)
      this.appendProperty(element, 'og:image:width', '1200')
      this.appendProperty(element, 'og:image:height', '630')
      this.appendProperty(element, 'og:image:alt', this.input.title)
    }
    this.appendProperty(element, 'og:type', 'website')
    this.appendProperty(element, 'og:url', this.input.url)

    //Twitter Tags
    this.appendProperty(element, 'twitter:card', 'summary_large_image')
    this.appendProperty(element, 'twitter:title', this.input.title)
    if (this.input.image) {
      this.appendProperty(element, 'twitter:image', this.input.image)
      this.appendProperty(element, 'twitter:image:alt', this.input.title)
    }

    const blockedPaths = this.request.headers.get('x-blocked-paths')
    if (blockedPaths) {
      this.appendProperty(element, 'x:blocked-paths', blockedPaths)
    }
  }
}
