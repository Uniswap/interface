type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
  description?: string
}

/**
 * Listener class for Cloudflare's HTMLRewriter {@link https://developers.cloudflare.com/workers/runtime-apis/html-rewriter}
 * to inject meta tags into the <head> of an HTML document.
 */
export class MetaTagInjector implements HTMLRewriterElementContentHandlers {
  constructor(private input: MetaTagInjectorInput, private request: Request) {}

  append(element: Element, property: string, content: string) {
    element.append(`<meta property="${property}" content="${content}"/>`, { html: true })
  }

  element(element: Element) {
    //Open Graph Tags
    this.append(element, 'og:title', this.input.title)
    if (this.input.description) {
      this.append(element, 'og:description', this.input.description)
    }
    if (this.input.image) {
      this.append(element, 'og:image', this.input.image)
      this.append(element, 'og:image:width', '1200')
      this.append(element, 'og:image:height', '630')
      this.append(element, 'og:image:alt', this.input.title)
    }
    this.append(element, 'og:type', 'website')
    this.append(element, 'og:url', this.input.url)

    //Twitter Tags
    this.append(element, 'twitter:card', 'summary_large_image')
    this.append(element, 'twitter:title', this.input.title)
    if (this.input.image) {
      this.append(element, 'twitter:image', this.input.image)
      this.append(element, 'twitter:image:alt', this.input.title)
    }

    const blockedPaths = this.request.headers.get('x-blocked-paths')
    if (blockedPaths) {
      this.append(element, 'x:blocked-paths', blockedPaths)
    }
  }
}
