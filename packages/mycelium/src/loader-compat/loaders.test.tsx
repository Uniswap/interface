import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => import('../compat/testing/react-native-mock'))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function renderTokenLoader({ isWebPlatform }: { isWebPlatform: boolean }): Promise<ReactTestRenderer> {
  vi.resetModules()
  vi.doMock('@universe/environment', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@universe/environment')>()),
    isWebPlatform,
  }))
  const { TokenLoader } = await import('./loaders')
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(createElement(TokenLoader, { opacity: 1, withPrice: true }))
  })
  if (renderer === undefined) {
    throw new Error('render did not commit')
  }
  return renderer
}

function findLogo(renderer: ReactTestRenderer): ReactTestInstance {
  const [logo] = renderer.root.findAll(
    (node) => node.props['backgroundColor'] === '$neutral3' && node.props['borderRadius'] === '$roundedFull',
  )
  if (!logo) {
    throw new Error('logo placeholder not rendered')
  }
  return logo
}

function findPlaceholderVariant(renderer: ReactTestRenderer, placeholderText: string): unknown {
  const [text] = renderer.root.findAll((node) => node.props['loadingPlaceholderText'] === placeholderText)
  return text?.props['variant']
}

afterEach(() => {
  vi.doUnmock('@universe/environment')
})

// Expected values are literals on purpose: they mirror the real TokenBalanceItem row
// (TokenLogo default 40px, body1 / body2 on native), so they must not be derived from loaders.tsx.
describe('TokenLoader', () => {
  it('matches the native TokenBalanceItem row geometry', async () => {
    const renderer = await renderTokenLoader({ isWebPlatform: false })

    expect(findLogo(renderer).props).toMatchObject({ height: 40, width: 40 })
    expect(findPlaceholderVariant(renderer, 'Token Full Name')).toBe('body1')
    expect(findPlaceholderVariant(renderer, '1,000 TFN')).toBe('body2')
    expect(findPlaceholderVariant(renderer, '$XX.XX')).toBe('body1')
    expect(findPlaceholderVariant(renderer, 'X.XX%')).toBe('body2')
  })

  it('keeps the web geometry unchanged', async () => {
    const renderer = await renderTokenLoader({ isWebPlatform: true })

    expect(findLogo(renderer).props).toMatchObject({ height: 36, width: 36 })
    expect(findPlaceholderVariant(renderer, 'Token Full Name')).toBe('body3')
    expect(findPlaceholderVariant(renderer, '1,000 TFN')).toBe('body4')
    expect(findPlaceholderVariant(renderer, 'X.XX%')).toBe('subheading2')
  })

  it('omits the price column without withPrice', async () => {
    vi.resetModules()
    const { TokenLoader } = await import('./loaders')
    let renderer: ReactTestRenderer | undefined
    act(() => {
      renderer = create(createElement(TokenLoader, { opacity: 1 }))
    })

    expect(renderer?.root.findAll((node) => node.props['loadingPlaceholderText'] === 'X.XX%')).toHaveLength(0)
  })
})
