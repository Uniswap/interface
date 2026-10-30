/**
 * Behavior contract for the ElementAfterText compat (INFRA-3601), asserted on
 * the rendered DOM against the legacy ui component's behavior: a centered row carrying
 * the text (legacy default color/variant unless overridden) with the element
 * after it — rendered inline on desktop web, wrapped on other web surfaces
 * (where the RN-only layout event never fires and the wrapper never
 * positions).
 */
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `isWebAppDesktop` is a module constant, not a function — the getter lets
// each test flip the platform branch.
const env = vi.hoisted(() => ({ isWebAppDesktop: true }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebAppDesktop(): boolean {
      return env.isWebAppDesktop
    },
  }
})

import { ElementAfterTextCompat } from './ElementAfterTextCompat'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  env.isWebAppDesktop = true
})

describe('desktop web rendering (inline element)', () => {
  it('renders the text and the element as row siblings', () => {
    const { container, getByText, getByTestId } = render(
      <ElementAfterTextCompat text="hello world" element={<span data-testid="after-element" />} />,
    )
    expect(getByText('hello world')).toBeDefined()
    const element = getByTestId('after-element')
    // Inline path: the element's parent is the wrapping row itself, not an
    // intermediate wrapper.
    expect(element.parentElement).toBe(container.firstElementChild)
  })

  it('applies the legacy text defaults and lets textProps override them', () => {
    const { getByText, rerender } = render(<ElementAfterTextCompat text="defaulted" />)
    // Legacy DEFAULT_TEXT_PROPS: neutral1 + body2; overridable by textProps.
    expect(getByText('defaulted').className).toContain('stext-neutral1')
    rerender(<ElementAfterTextCompat text="defaulted" textProps={{ color: '$neutral2', variant: 'subheading2' }} />)
    expect(getByText('defaulted').className).toContain('stext-neutral2')
  })

  it('forwards wrapperProps to the row', () => {
    const { container } = render(<ElementAfterTextCompat text="wrapped" wrapperProps={{ testID: 'the-wrapper' }} />)
    expect(container.querySelector('[data-testid="the-wrapper"]')).not.toBeNull()
  })

  it('renders without an element', () => {
    const { getByText } = render(<ElementAfterTextCompat text="alone" />)
    expect(getByText('alone')).toBeDefined()
  })
})

describe('non-desktop web rendering (wrapped element)', () => {
  it('wraps the element (the legacy positioning wrapper, never positioned on web)', () => {
    env.isWebAppDesktop = false
    const { container, getByTestId } = render(
      <ElementAfterTextCompat text="hello world" element={<span data-testid="after-element" />} />,
    )
    const element = getByTestId('after-element')
    expect(element.parentElement).not.toBe(container.firstElementChild)
    expect(element.parentElement?.parentElement).toBe(container.firstElementChild)
  })
})
