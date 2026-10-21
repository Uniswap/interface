import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FlexCompat } from '../flex-compat/FlexCompat.web'
import { containUntrustedTag, SAFE_COMPAT_TAGS, type SafeCompatTag } from './safe-tags'

describe('containUntrustedTag', () => {
  // The allowlist must never grow to include an element that loads or executes a resource.
  it.each([
    'script',
    'svg',
    'math',
    'iframe',
    'object',
    'embed',
    'img',
    'form',
    'input',
    'link',
    'base',
    'style',
    'meta',
  ])('never allowlists the resource-loading element %s', (tag) => {
    expect(SAFE_COMPAT_TAGS).not.toContain(tag)
  })

  it.each(['a', 'span', 'div', 'button', 'h1', 'main', 'nav', 'table', 'tr', 'td'])(
    'keeps the allowlisted %s',
    (tag) => {
      expect(containUntrustedTag(tag, {})).toBe(tag)
    },
  )

  it.each([
    'script',
    'iframe',
    'object',
    'embed',
    'base',
    'link',
    'style',
    'svg',
    'math',
    'img',
    'form',
    'input',
    'SCRIPT',
    '',
  ])('falls back to div for %j', (tag) => {
    expect(containUntrustedTag(tag, {})).toBe('div')
  })

  it('defaults to div when no tag is given', () => {
    expect(containUntrustedTag(undefined, {})).toBe('div')
  })

  it('strips href/target/rel/download in place on non-anchors and keeps everything else', () => {
    const props: Record<string, unknown> = {
      href: '/x',
      target: '_blank',
      rel: 'x',
      download: 'y',
      id: 'keep',
      title: 't',
    }
    expect(containUntrustedTag('span', props)).toBe('span')
    expect(props).toEqual({ id: 'keep', title: 't' })
  })

  it.each(['/swap', '#top', '?q=1', 'swap', 'https://app.uniswap.org', 'HTTP://x', 'mailto:a@b.c'])(
    'keeps the safe anchor href %s',
    (href) => {
      const props: Record<string, unknown> = { href }
      containUntrustedTag('a', props)
      expect(props).toEqual({ href })
    },
  )

  /* oxlint-disable no-script-url -- hostile inputs under test */
  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'java\nscript:alert(1)',
    ' javascript:x',
    'data:text/html,x',
    'vbscript:x',
    'blob:x',
  ])('drops the anchor href %j', (href) => {
    const props: Record<string, unknown> = { href, target: '_blank' }
    containUntrustedTag('a', props)
    expect(props).toEqual({ target: '_blank' })
  })
  /* oxlint-enable no-script-url */

  it('leaves anchor props on a real anchor', () => {
    const props: Record<string, unknown> = { href: '/x', target: '_blank', rel: 'noreferrer', download: 'y' }
    expect(containUntrustedTag('a', props)).toBe('a')
    expect(props).toEqual({ href: '/x', target: '_blank', rel: 'noreferrer', download: 'y' })
  })
})

// Every compat primitive routes through createCompatComponent, so Flex is contained like Text.
describe('FlexCompat untrusted tag containment', () => {
  it('renders a div instead of a smuggled script with an href', () => {
    // Hostile tags arrive as runtime strings from parsed markup, never through the prop type.
    const markup = renderToStaticMarkup(
      <FlexCompat tag={'script' as unknown as SafeCompatTag} href="https://evil.example" />,
    )
    expect(markup.startsWith('<div')).toBe(true)
    expect(markup).not.toContain('href')
  })

  it('keeps an allowlisted tag', () => {
    expect(renderToStaticMarkup(<FlexCompat tag="nav" />).startsWith('<nav')).toBe(true)
  })
})
