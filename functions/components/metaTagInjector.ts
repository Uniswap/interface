type MetaTagInjectorInput = {
  title: any
  image: any
  url: any
}

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
    this.append(element, 'og:image', this.input.image)
    this.append(element, 'og:image:width', '1200')
    this.append(element, 'og:image:height', '630')
    this.append(element, 'og:type', 'website')
    this.append(element, 'og:url', this.input.url)
    this.append(element, 'og:image:alt', 'https://app.uniswap.org/images/512x512_App_Icon.png')

    //Twitter Tags
    this.append(element, 'twitter:card', 'summary_large_image')
    this.append(element, 'twitter:title', this.input.title)
    this.append(element, 'twitter:image', this.input.image)
    this.append(element, 'twitter:image:alt', 'https://app.uniswap.org/images/512x512_App_Icon.png')
  }
}
