import { act, waitFor } from '@testing-library/react'
import { getCapabilities } from '@wagmi/core/experimental'
import { useWalletCapabilities } from 'state/walletCapabilities/hooks/useWalletCapabilities'
import { render } from 'test-utils/render'

beforeEach(() => {
  jest.resetAllMocks()
})

let disconnectCallback: (() => void) | undefined

jest.mock('@wagmi/core/experimental', () => ({
  getCapabilities: jest.fn(),
}))

jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccountEffect: ({ onConnect, onDisconnect }: { onConnect: () => void; onDisconnect: () => void }) => {
    onConnect()
    disconnectCallback = onDisconnect
  },
}))

function TestComponent() {
  const { isAtomicBatchingSupported } = useWalletCapabilities()
  return <div data-testid="capabilities">{isAtomicBatchingSupported ? 'true' : 'false'}</div>
}

describe('useWalletCapabilities', () => {
  it('should set isAtomicBatchingSupported to true when getCapabilities resolves', async () => {
    ;(getCapabilities as jest.Mock).mockResolvedValueOnce({
      atomicBatch: { supported: true },
    })

    const renderResult = render(<TestComponent />)
    const { getByTestId } = renderResult

    await waitFor(() => expect(getByTestId('capabilities')).toHaveTextContent('true'))
  })

  it('should set isAtomicBatchingSupported to false on disconnect', async () => {
    ;(getCapabilities as jest.Mock).mockResolvedValueOnce({
      atomicBatch: { supported: true },
    })

    const renderResult = render(<TestComponent />) as any
    const { getByTestId } = renderResult

    await waitFor(() => expect(getByTestId('capabilities')).toHaveTextContent('true'))

    act(() => {
      disconnectCallback && disconnectCallback()
    })

    await waitFor(() => expect(getByTestId('capabilities')).toHaveTextContent('false'))
  })

  it('should set isAtomicBatchingSupported to false when getCapabilities fails', async () => {
    ;(getCapabilities as jest.Mock).mockRejectedValueOnce(new Error('Timeout'))

    const renderResult = render(<TestComponent />)
    const { getByTestId } = renderResult

    await waitFor(() => expect(getByTestId('capabilities')).toHaveTextContent('false'))
  })

  it('should set isAtomicBatchingSupported to false after a timeout', async () => {
    jest.useFakeTimers()
    ;(getCapabilities as jest.Mock).mockReturnValue(new Promise(() => {}))

    const renderResult = render(<TestComponent />) as any
    const { getByTestId } = renderResult

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => expect(getByTestId('capabilities')).toHaveTextContent('false'))
    jest.useRealTimers()
  })
})
