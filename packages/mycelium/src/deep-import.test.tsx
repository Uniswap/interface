// @vitest-environment jsdom
/**
 * Deep-import contract (INFRA-2956 / #37009 codemod).
 *
 * The codemod rewrites deep legacy icon imports to
 * `@universe/mycelium/icons/<Name>` so Metro-style bundlers never pay for the
 * barrel. This test imports through the package name (self-reference), so it
 * only passes when the `"./icons/*"` exports-map entry resolves — mycelium's
 * vitest config has no tsconfig-paths plugin, meaning resolution here goes
 * through package.json `exports`.
 */
import { render } from '@testing-library/react'
import { Heart } from '@universe/mycelium/icons/Heart'
import { describe, expect, it } from 'vitest'

describe('deep icon import via exports map', () => {
  it('resolves @universe/mycelium/icons/Heart and renders an svg', () => {
    const { container } = render(<Heart size={16} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg?.querySelector('path')).not.toBeNull()
  })
})
