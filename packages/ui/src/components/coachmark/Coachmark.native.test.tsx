import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// expo-blur is a transitive dep of TouchableArea and ships JSX in a `.js` file that Vite refuses to
// parse. Mock it so importing the native Coachmark module graph doesn't fail.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

// Tamagui's measure path (used by the trigger ref) relies on IntersectionObserver, which jsdom does
// not provide. A no-op keeps measure from throwing.
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return []
    }
  } as unknown as typeof IntersectionObserver
})

import { CoachmarkBubble, Coachmark } from 'ui/src/components/coachmark/Coachmark.native'
import { Text } from 'ui/src/components/text'
import { SharedUIUniswapProvider } from 'ui/src/test/render'

const COACHMARK_TEXT = 'Pool positions are now included in your total balance'
const CHILD_TEXT = 'balance'

describe('Coachmark (native)', () => {
  it('renders its children when closed', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open={false} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(screen.queryByText(CHILD_TEXT)).not.toBeNull()
  })

  it('does not render the coachmark text when closed', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open={false} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(screen.queryByText(COACHMARK_TEXT)).toBeNull()
  })
})

describe('CoachmarkBubble', () => {
  it('renders the coachmark text', () => {
    render(
      <SharedUIUniswapProvider>
        <CoachmarkBubble text={COACHMARK_TEXT} onDismiss={vi.fn()} />
      </SharedUIUniswapProvider>,
    )
    expect(screen.getByText(COACHMARK_TEXT)).not.toBeNull()
  })

  it('calls onDismiss when pressed', () => {
    const onDismiss = vi.fn()
    render(
      <SharedUIUniswapProvider>
        <CoachmarkBubble text={COACHMARK_TEXT} onDismiss={onDismiss} />
      </SharedUIUniswapProvider>,
    )
    fireEvent.click(screen.getByText(COACHMARK_TEXT))
    expect(onDismiss).toHaveBeenCalled()
  })
})
