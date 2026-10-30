import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react-native'
import {
  CreatePositionRequest,
  CreatePositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { CreatePoolParameters } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { createElement, type PropsWithChildren } from 'react'
import { V2LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { useCreatePositionQuery } from 'uniswap/src/data/apiClients/liquidityService/useCreatePositionQuery'

vi.mock('uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient', () => ({
  V1LiquidityServiceClient: {},
  V2LiquidityServiceClient: { createPosition: vi.fn(), createClassicPosition: vi.fn() },
}))

const mockCreatePosition = vi.mocked(V2LiquidityServiceClient.createPosition)

function newPoolRequest(initialPrice: string): CreatePositionRequest {
  return new CreatePositionRequest({
    walletAddress: '0x0000000000000000000000000000000000000001',
    pool: { case: 'newPool', value: new CreatePoolParameters({ tickSpacing: 60, initialPrice }) },
  })
}

describe(useCreatePositionQuery, () => {
  let queryClient: QueryClient

  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    mockCreatePosition.mockReset()
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  // Confirm is gated on the tx built from this calldata (`isDisabled={!txInfo?.action}`), so a request
  // that changes under review — e.g. accepting an updated starting price — must read as "no calldata"
  // until its own quote lands, never as the previous request's calldata.
  it('returns no calldata for new request params until their own quote resolves', async () => {
    const reviewed = new CreatePositionResponse({ gasFee: 'reviewed' })
    mockCreatePosition.mockResolvedValueOnce(reviewed)

    const { result, rerender } = renderHook(
      ({ params }: { params: CreatePositionRequest }) =>
        useCreatePositionQuery({ createCalldataQueryParams: params, transactionError: false, isQueryEnabled: true }),
      { wrapper: Wrapper, initialProps: { params: newPoolRequest('79228162514264337593543950336') } },
    )
    await waitFor(() => expect(result.current.createCalldata).toBe(reviewed))

    let resolveAccepted: (response: CreatePositionResponse) => void = () => undefined
    mockCreatePosition.mockReturnValueOnce(
      new Promise<CreatePositionResponse>((resolve) => {
        resolveAccepted = resolve
      }) as ReturnType<typeof V2LiquidityServiceClient.createPosition>,
    )
    rerender({ params: newPoolRequest('83095197869223157896060286990') })

    expect(result.current.createCalldata).toBeUndefined()

    const accepted = new CreatePositionResponse({ gasFee: 'accepted' })
    resolveAccepted(accepted)
    await waitFor(() => expect(result.current.createCalldata).toBe(accepted))
  })
})
