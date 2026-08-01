import { act, render } from '@testing-library/react'
import { SharedEventName } from '@uniswap/analytics-events'
import { PropsWithChildren } from 'react'
import { AnalyticsNavigationContextProvider } from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { focusEffectHarness, mockSendEvent } = vi.hoisted(() => {
  let callback: (() => void) | undefined
  let isFocused = true

  return {
    focusEffectHarness: {
      blur(): void {
        isFocused = false
      },
      focus(): void {
        if (!isFocused) {
          isFocused = true
          callback?.()
        }
      },
      reset(): void {
        callback = undefined
        isFocused = true
      },
      subscribe(nextCallback: () => void): () => void {
        callback = nextCallback
        if (isFocused) {
          callback()
        }

        return (): void => {
          if (callback === nextCallback) {
            callback = undefined
          }
        }
      },
    },
    mockSendEvent: vi.fn(),
  }
})

vi.mock('@react-navigation/core', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')

  return {
    useFocusEffect(callback: () => void): void {
      useEffect(() => focusEffectHarness.subscribe(callback), [callback])
    },
  }
})

vi.mock('@universe/environment', () => ({
  isWebPlatform: false,
}))

vi.mock('utilities/src/telemetry/analytics/analytics', () => ({
  analytics: { sendEvent: mockSendEvent },
}))

const useIsPartOfNavigationTree = (): boolean => true
const shouldLogScreen = (): boolean => true

function NavigationTree({ children }: PropsWithChildren): JSX.Element {
  return (
    <AnalyticsNavigationContextProvider
      useIsPartOfNavigationTree={useIsPartOfNavigationTree}
      shouldLogScreen={shouldLogScreen}
    >
      {children}
    </AnalyticsNavigationContextProvider>
  )
}

describe('Trace', () => {
  beforeEach(() => {
    focusEffectHarness.reset()
    mockSendEvent.mockReset()
  })

  it('uses the custom impression event inside a navigation tree', () => {
    render(
      <NavigationTree>
        <Trace logImpression eventOnTrigger="Custom Impression" properties={{ source: 'earn' }}>
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledWith('Custom Impression', { source: 'earn' })
  })

  it('does not refire for property updates and uses the latest properties on the next focus', () => {
    const { rerender } = render(
      <NavigationTree>
        <Trace logImpression eventOnTrigger="Earn Impression" properties={{ source: 'earn', vaultId: 'initial' }}>
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledTimes(1)
    expect(mockSendEvent).toHaveBeenLastCalledWith('Earn Impression', { source: 'earn', vaultId: 'initial' })

    rerender(
      <NavigationTree>
        <Trace logImpression eventOnTrigger="Earn Impression" properties={{ source: 'earn', vaultId: 'updated' }}>
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledTimes(1)

    act(() => {
      focusEffectHarness.blur()
      focusEffectHarness.focus()
    })

    expect(mockSendEvent).toHaveBeenCalledTimes(2)
    expect(mockSendEvent).toHaveBeenLastCalledWith('Earn Impression', { source: 'earn', vaultId: 'updated' })
  })

  it('refires when the screen identity changes while focused', () => {
    const { rerender } = render(
      <NavigationTree>
        <Trace logImpression screen="Home">
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledWith(SharedEventName.PAGE_VIEWED, { screen: 'Home' })

    rerender(
      <NavigationTree>
        <Trace logImpression screen="Earn">
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledTimes(2)
    expect(mockSendEvent).toHaveBeenLastCalledWith(SharedEventName.PAGE_VIEWED, { screen: 'Earn' })
  })

  it('refires when impression logging is enabled while focused', () => {
    const { rerender } = render(
      <NavigationTree>
        <Trace screen="Home">
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).not.toHaveBeenCalled()

    rerender(
      <NavigationTree>
        <Trace logImpression screen="Home">
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledTimes(1)
    expect(mockSendEvent).toHaveBeenCalledWith(SharedEventName.PAGE_VIEWED, { screen: 'Home' })
  })

  it('refires when the impression event changes while focused', () => {
    const { rerender } = render(
      <NavigationTree>
        <Trace logImpression eventOnTrigger="Initial Impression">
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledWith('Initial Impression', {})

    rerender(
      <NavigationTree>
        <Trace logImpression eventOnTrigger="Updated Impression">
          <div />
        </Trace>
      </NavigationTree>,
    )

    expect(mockSendEvent).toHaveBeenCalledTimes(2)
    expect(mockSendEvent).toHaveBeenLastCalledWith('Updated Impression', {})
  })
})
