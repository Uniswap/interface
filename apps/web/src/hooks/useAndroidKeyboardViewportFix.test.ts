import { renderHook } from '@testing-library/react'
import { useAndroidKeyboardViewportFix } from '~/hooks/useAndroidKeyboardViewportFix'

const env = vi.hoisted(() => ({ isWebAndroid: true }))
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebAndroid() {
      return env.isWebAndroid
    },
  }
})

const BASE = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
const RESIZES = 'interactive-widget=resizes-content'

function viewportContent(): string {
  return document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? ''
}

describe('useAndroidKeyboardViewportFix', () => {
  beforeEach(() => {
    env.isWebAndroid = true
    document.head.querySelectorAll('meta[name="viewport"]').forEach((meta) => meta.remove())
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.setAttribute('content', BASE)
    document.head.appendChild(meta)
  })

  it('adds interactive-widget=resizes-content while open on Android and restores it on unmount', () => {
    const { unmount } = renderHook(() => useAndroidKeyboardViewportFix(true))
    expect(viewportContent()).toBe(`${BASE}, ${RESIZES}`)
    unmount()
    expect(viewportContent()).toBe(BASE)
  })

  it('is a no-op when disabled', () => {
    renderHook(() => useAndroidKeyboardViewportFix(false))
    expect(viewportContent()).toBe(BASE)
  })

  it('is a no-op when not on Android web', () => {
    env.isWebAndroid = false
    renderHook(() => useAndroidKeyboardViewportFix(true))
    expect(viewportContent()).toBe(BASE)
  })

  it('replaces an existing interactive-widget value instead of duplicating it', () => {
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute('content', `${BASE}, interactive-widget=resizes-visual`)

    const { unmount } = renderHook(() => useAndroidKeyboardViewportFix(true))

    const content = viewportContent()
    expect(content).toContain(RESIZES)
    expect(content).not.toContain('resizes-visual')
    expect(content.match(/interactive-widget/g)?.length).toBe(1)

    unmount()
    expect(viewportContent()).toBe(`${BASE}, interactive-widget=resizes-visual`)
  })
})
