import { describe, expect, it } from 'vitest'
import { getRenamedIifeName, rewriteIifeFooter } from './contentScriptIifeRename'

const BUNDLE_BODY = 'var __wxt_cs_injected=(function(){"use strict";return 1})();\n'

describe('getRenamedIifeName', () => {
  it('prefixes the entrypoint var name', () => {
    expect(getRenamedIifeName('injected')).toBe('__wxt_cs_injected')
    expect(getRenamedIifeName('ethereum')).toBe('__wxt_cs_ethereum')
  })
})

describe('rewriteIifeFooter', () => {
  it('rewrites the trailing footer to the renamed var', () => {
    const code = `${BUNDLE_BODY}injected;`
    expect(rewriteIifeFooter({ code, originalName: 'injected' })).toBe(`${BUNDLE_BODY}__wxt_cs_injected;`)
  })

  it('is idempotent when the footer was already rewritten', () => {
    const rewritten = rewriteIifeFooter({ code: `${BUNDLE_BODY}injected;`, originalName: 'injected' })
    expect(rewriteIifeFooter({ code: rewritten, originalName: 'injected' })).toBe(rewritten)
  })

  it('does not treat a longer identifier ending in the footer name as the footer', () => {
    // `notinjected;` must not match the `injected;` footer.
    expect(() => rewriteIifeFooter({ code: `${BUNDLE_BODY}notinjected;`, originalName: 'injected' })).toThrow(
      /Expected the "injected" content script entry chunk/,
    )
  })

  it('does not treat a $-prefixed identifier ending in the footer name as the footer', () => {
    expect(() => rewriteIifeFooter({ code: `${BUNDLE_BODY}$injected;`, originalName: 'injected' })).toThrow(
      /iife-footer/,
    )
  })

  it('fails loudly when the footer is missing entirely', () => {
    expect(() => rewriteIifeFooter({ code: BUNDLE_BODY, originalName: 'injected' })).toThrow(
      /WXT's footer format may have changed/,
    )
  })

  it('handles a chunk that is exactly the footer', () => {
    expect(rewriteIifeFooter({ code: 'injected;', originalName: 'injected' })).toBe('__wxt_cs_injected;')
  })
})
