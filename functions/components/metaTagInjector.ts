type MetaTagInjectorInput = {
  title: string
  image?: string
  url: string
}

/**
 * Listener class for Cloudflare's HTMLRewriter {@link https://developers.cloudflare.com/workers/runtime-apis/html-rewriter}
 * to inject meta tags into the <head> of an HTML document.
 */
export class MetaTagInjector {
  constructor(private input: MetaTagInjectorInput) {}

  append(element, property: string, content: string) {
    element.append(`<meta property="${property}" content="${content}"/>`, { html: true })
  }

  /**
   * Event handler for ElementHandler {@link https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/#element-handlers}
   */
  element(element) {
    //Open Graph Tags
    this.append(element, 'og:title', this.input.title)
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
  }
}
