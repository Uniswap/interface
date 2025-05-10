import { MetaTagInjectorInput } from 'shared-cloud/metatags'

/**
 * Injects meta tags into the <head> element using Cloudflare's HTMLRewriter.
 * @see https://developers.cloudflare.com/workers/runtime-apis/html-rewriter
 */
export class MetaTagInjector implements HTMLRewriterElementContentHandlers {
  static SELECTOR = 'head'

  constructor(
    private readonly input: MetaTagInjectorInput,
    private readonly request: Request,
  ) {}

  /**
   * Appends a meta tag to the element.
   * @param element - The HTML element to append to.
   * @param attribute - Meta tag attribute (e.g., property="og:title").
   * @param content - Meta tag content.
   */
  private append(element: Element, attribute: string, content: string) {
    const safeContent = this.escape(content)
    element.append(`<meta ${attribute} content="${safeContent}" data-rh="true">`, { html: true })
  }

  /**
   * Appends a property-based meta tag.
   * @param element - The HTML element to append to.
   * @param property - The OpenGraph or Twitter meta property.
   * @param content - The content of the property.
   */
  private appendProperty(element: Element, property: string, content: string) {
    if (content) {
      this.append(element, `property="${property}"`, content)
    }
  }

  /**
   * Escapes special HTML characters in content.
   */
  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * Injects all required meta tags into the <head> of the HTML document.
   */
  element(element: Element): void {
    const { title, description, image, url } = this.input

    if (description) {
      this.append(element, 'name="description"', description)
      this.appendProperty(element, 'og:description', description)
    }

    this.appendProperty(element, 'og:title', title)
    this.appendProperty(element, 'og:type', 'website')
    this.appendProperty(element, 'og:url', url)

    if (image) {
      this.appendProperty(element, 'og:image', image)
      this.appendProperty(element, 'og:image:width', '1200')
      this.appendProperty(element, 'og:image:height', '630')
      this.appendProperty(element, 'og:image:alt', title)

      this.appendProperty(element, 'twitter:image', image)
      this.appendProperty(element, 'twitter:image:alt', title)
    }

    this.appendProperty(element, 'twitter:card', 'summary_large_image')
    this.appendProperty(element, 'twitter:title', title)

    const blockedPaths = this.request.headers.get('x-blocked-paths')
    if (blockedPaths) {
      this.appendProperty(element, 'x:blocked-paths', blockedPaths)
    }
  }
}
