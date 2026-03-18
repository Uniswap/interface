import {
  COPY_FEEDBACK_RESET_MS,
  MultichainAddressList,
} from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { act, fireEvent, render } from 'uniswap/src/test/test-utils'

vi.mock('utilities/src/addresses', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    shortenAddress: vi.fn(({ address }: { address: string }) => `${address.slice(0, 6)}...`),
  }
})

const TEST_ENTRIES: MultichainTokenEntry[] = [
  { chainId: UniverseChainId.Mainnet, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { chainId: UniverseChainId.Base, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { chainId: UniverseChainId.ArbitrumOne, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
]

describe(MultichainAddressList, () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a row per chain', () => {
    const { queryByText } = render(<MultichainAddressList chains={TEST_ENTRIES} onCopyAddress={vi.fn()} />)

    expect(queryByText('Ethereum')).toBeTruthy()
    expect(queryByText('Base')).toBeTruthy()
    expect(queryByText('Arbitrum')).toBeTruthy()
  })

  it('shows shortened address text', () => {
    const { queryByText } = render(<MultichainAddressList chains={TEST_ENTRIES} onCopyAddress={vi.fn()} />)

    expect(queryByText('0xA0b8...')).toBeTruthy()
    expect(queryByText('0x8335...')).toBeTruthy()
  })

  it('calls onCopyAddress on row press', () => {
    const onCopyAddress = vi.fn()
    const { getAllByTestId } = render(<MultichainAddressList chains={TEST_ENTRIES} onCopyAddress={onCopyAddress} />)

    const rows = getAllByTestId(TestID.MultichainCopyAddress)
    fireEvent.press(rows[0]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onCopyAddress).toHaveBeenCalledWith(TEST_ENTRIES[0]!.address)
  })

  it('sets copied state when showInlineFeedback is true and resets after timeout', () => {
    const onCopyAddress = vi.fn()
    const { getAllByTestId } = render(
      <MultichainAddressList showInlineFeedback chains={TEST_ENTRIES} onCopyAddress={onCopyAddress} />,
    )

    const rows = getAllByTestId(TestID.MultichainCopyAddress)
    fireEvent.press(rows[0]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onCopyAddress).toHaveBeenCalledWith(TEST_ENTRIES[0]!.address)

    // Timer resets the copied state after COPY_FEEDBACK_RESET_MS
    act(() => {
      vi.advanceTimersByTime(COPY_FEEDBACK_RESET_MS)
    })

    // After timeout, no pending timers remain
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not show "Copied!" text when showInlineFeedback is false', () => {
    const onCopyAddress = vi.fn()
    const { getAllByTestId, queryByText } = render(
      <MultichainAddressList chains={TEST_ENTRIES} showInlineFeedback={false} onCopyAddress={onCopyAddress} />,
    )

    const rows = getAllByTestId(TestID.MultichainCopyAddress)
    fireEvent.press(rows[0]!, ON_PRESS_EVENT_PAYLOAD)

    expect(onCopyAddress).toHaveBeenCalledWith(TEST_ENTRIES[0]!.address)
    expect(queryByText('Copied')).toBeFalsy()
  })
})
