/**
 * Native leg: children must leave their writing position and appear in the
 * provider's overlay layer, carrying the same resolved z-index the web leg
 * puts on its wrapper.
 */
import { render, screen } from '@testing-library/react'
import { createContext, useContext } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PORTAL_LAYER_TEST_ID } from './PortalProps'
import { PORTAL_DEFAULT_Z_INDEX, PORTAL_STACK_LAYER_STEP } from './stack'

vi.mock('react-native', () => import('./testing/react-native-mock'))

// Explicit `.native` path: the mycelium vitest resolver prefers `.web.*`, so a
// bare './Portal' import would silently load the web leg here.
const { Portal, PortalProvider } = await import('./Portal.native')
const { View } = await import('./testing/react-native-mock')

function layer(): HTMLElement {
  return screen.getByTestId(PORTAL_LAYER_TEST_ID)
}

/** The absolutely-filled entry view the provider wraps each portal in. */
function entryWrapper(testId: string): HTMLElement {
  const content = screen.getByTestId(testId)
  const wrapper = content.parentElement
  if (!wrapper) {
    throw new Error('portal content has no wrapper')
  }
  return wrapper
}

describe('Portal (native)', () => {
  it('teleports children out of their writing position into the provider layer', () => {
    render(
      <PortalProvider>
        <View testID="app-content">
          <Portal>
            <View testID="overlay" />
          </Portal>
        </View>
      </PortalProvider>,
    )

    expect(screen.getByTestId('app-content').contains(screen.getByTestId('overlay'))).toBe(false)
    expect(layer().contains(screen.getByTestId('overlay'))).toBe(true)
  })

  it('defaults to the unstacked z-index', () => {
    render(
      <PortalProvider>
        <Portal>
          <View testID="overlay" />
        </Portal>
      </PortalProvider>,
    )

    expect(entryWrapper('overlay').style.zIndex).toBe(String(PORTAL_DEFAULT_Z_INDEX))
  })

  it('applies an explicit zIndex to the entry wrapper', () => {
    render(
      <PortalProvider>
        <Portal zIndex={100020}>
          <View testID="overlay" />
        </Portal>
      </PortalProvider>,
    )

    expect(entryWrapper('overlay').style.zIndex).toBe('100020')
  })

  it('resolves stackZIndex with the same arithmetic as the web leg', () => {
    render(
      <PortalProvider>
        <Portal stackZIndex={1070}>
          <View testID="overlay" />
        </Portal>
      </PortalProvider>,
    )

    expect(entryWrapper('overlay').style.zIndex).toBe(String(1070 + PORTAL_STACK_LAYER_STEP + 1))
  })

  it('removes its entry from the layer when it unmounts', () => {
    function App({ open }: { open: boolean }): React.JSX.Element {
      return (
        <PortalProvider>
          {open ? (
            <Portal>
              <View testID="overlay" />
            </Portal>
          ) : null}
        </PortalProvider>
      )
    }

    const { rerender } = render(<App open />)
    expect(screen.queryByTestId('overlay')).not.toBeNull()

    rerender(<App open={false} />)
    expect(screen.queryByTestId('overlay')).toBeNull()
  })

  // Pins the one place the two legs genuinely differ, so it fails loudly if
  // someone later assumes the parity the prop surface otherwise promises.
  it('does NOT see context provided between the provider and the call site (web does)', () => {
    const ValueContext = createContext('from-provider-scope')

    function ShowValue(): React.JSX.Element {
      return <View testID="ctx-value">{useContext(ValueContext)}</View>
    }

    render(
      <PortalProvider>
        <ValueContext.Provider value="from-call-site-scope">
          <Portal>
            <ShowValue />
          </Portal>
        </ValueContext.Provider>
      </PortalProvider>,
    )

    // Children are re-parented into the provider's subtree, so they read the
    // default rather than the value provided below the provider. On web the
    // same tree would read 'from-call-site-scope'.
    expect(screen.getByTestId('ctx-value').textContent).toBe('from-provider-scope')
  })

  it('resolves a stackZIndex change on a mounted portal against siblings, not itself', () => {
    function App({ stack }: { stack: number }): React.JSX.Element {
      return (
        <PortalProvider>
          <Portal stackZIndex={stack}>
            <View testID="overlay" />
          </Portal>
        </PortalProvider>
      )
    }

    const { rerender } = render(<App stack={1070} />)
    expect(entryWrapper('overlay').style.zIndex).toBe(String(1070 + PORTAL_STACK_LAYER_STEP + 1))

    rerender(<App stack={1080} />)
    // Without the self-exclusion guard this compounds to 12152.
    expect(entryWrapper('overlay').style.zIndex).toBe(String(1080 + PORTAL_STACK_LAYER_STEP + 1))
  })

  it('does not let a zIndex+stackZIndex portal inflate a later sibling', () => {
    function App({ showSecond }: { showSecond: boolean }): React.JSX.Element {
      return (
        <PortalProvider>
          <Portal stackZIndex={1070} zIndex={100020}>
            <View testID="explicit" />
          </Portal>
          {showSecond ? (
            <Portal stackZIndex={1070}>
              <View testID="stacked" />
            </Portal>
          ) : null}
        </PortalProvider>
      )
    }

    const { rerender } = render(<App showSecond={false} />)
    rerender(<App showSecond />)

    expect(entryWrapper('explicit').style.zIndex).toBe('100020')
    expect(entryWrapper('stacked').style.zIndex).toBe(String(1070 + PORTAL_STACK_LAYER_STEP + 1))
  })

  it('throws when rendered without a provider', () => {
    expect(() =>
      render(
        <Portal>
          <View testID="overlay" />
        </Portal>,
      ),
    ).toThrowError(/PortalProvider/)
  })
})
