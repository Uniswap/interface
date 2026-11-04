import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { TradingApi } from '@universe/api'
import { createElement, type ReactNode } from 'react'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'

const { mockFetchCheckApproval } = vi.hoisted(() => ({ mockFetchCheckApproval: vi.fn() }))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: { fetchCheckApproval: (...args: unknown[]) => mockFetchCheckApproval(...args) },
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const ACROSS_SPOKE_POOL = '0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64'
const RELAY_DEPOSITORY = '0x4cd00e387622c35bddb9b4c962c136462338bc31'

const acrossQuote: TradingApi.BridgeQuote = {
  quoteId: 'poll-1',
  provider: TradingApi.BridgeProvider.ACROSS,
  approvalSpender: ACROSS_SPOKE_POOL,
}
const nextAcrossQuote: TradingApi.BridgeQuote = { ...acrossQuote, quoteId: 'poll-2' }
const relayQuote: TradingApi.BridgeQuote = {
  quoteId: 'poll-3',
  provider: TradingApi.BridgeProvider.RELAY,
  approvalSpender: RELAY_DEPOSITORY,
}

const approvalRequest = (quote: TradingApi.BridgeQuote): TradingApi.ApprovalRequest => ({
  walletAddress: '0xaaaaBBBBccccDDDDeeeeFFFF000011112222Aaaa',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amount: '1000000',
  chainId: TradingApi.ChainId._8453,
  quote,
})

const approveTx: TradingApi.TransactionRequest = {
  to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  data: '0x095ea7b3',
  value: '0',
  chainId: TradingApi.ChainId._8453,
}

const response: TradingApi.ApprovalResponse = { requestId: 'req-1', approval: approveTx, cancel: approveTx }

describe('useCheckApprovalQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchCheckApproval.mockResolvedValue(response)
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  })

  const wrapper = ({ children }: { children: ReactNode }): ReturnType<typeof createElement> =>
    createElement(QueryClientProvider, { client: queryClient }, children)

  it('keeps the approval across quote polls from the same vendor, and a refetch sends the latest quote', async () => {
    const { result, rerender } = renderHook(
      (props: { quote: TradingApi.BridgeQuote }) => useCheckApprovalQuery({ params: approvalRequest(props.quote) }),
      { wrapper, initialProps: { quote: acrossQuote } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ quote: nextAcrossQuote })

    expect(result.current.data).toEqual(response)
    expect(mockFetchCheckApproval).toHaveBeenCalledTimes(1)

    await result.current.refetch()

    expect(mockFetchCheckApproval).toHaveBeenLastCalledWith(approvalRequest(nextAcrossQuote))
  })

  it('checks the approval again when another vendor wins the quote', async () => {
    const { result, rerender } = renderHook(
      (props: { quote: TradingApi.BridgeQuote }) => useCheckApprovalQuery({ params: approvalRequest(props.quote) }),
      { wrapper, initialProps: { quote: acrossQuote } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ quote: relayQuote })
    await waitFor(() => expect(mockFetchCheckApproval).toHaveBeenCalledTimes(2))

    expect(mockFetchCheckApproval).toHaveBeenLastCalledWith(approvalRequest(relayQuote))
  })
})
