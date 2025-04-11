import { renderHook } from '@testing-library/react-hooks'
import { providers } from 'ethers/lib/ethers'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/hooks/usePermit2Signature'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/hooks/useTransactionRequestInfo'
import { useWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/hooks/useWrapTransactionRequest'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/useV4SwapEnabled'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { ETH, WETH } from 'uniswap/src/test/fixtures'
import { createMockDerivedSwapInfo, createMockTokenApprovalInfo } from 'uniswap/src/test/fixtures/transactions/swap'

jest.mock('uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery')
jest.mock('uniswap/src/features/transactions/swap/hooks/usePermit2Signature')
jest.mock('uniswap/src/features/transactions/swap/hooks/useWrapTransactionRequest')
jest.mock('uniswap/src/features/gas/hooks')
jest.mock('uniswap/src/features/transactions/swap/useV4SwapEnabled')
jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    ...jest.requireActual('uniswap/src/features/gating/hooks'),
    useDynamicConfigValue: jest.fn().mockImplementation((config: unknown, key: unknown, defaultVal: unknown) => {
      return defaultVal
    }),
  }
})

const mockUseTradingApiSwapQuery = useTradingApiSwapQuery as jest.Mock
const mockUsePermit2SignatureWithData = usePermit2SignatureWithData as jest.Mock
const mockUseWrapTransactionRequest = useWrapTransactionRequest as jest.Mock
const mockUseTransactionGasFee = useTransactionGasFee as jest.Mock
const mockUseV4SwapEnabled = useV4SwapEnabled as jest.Mock

describe('useTransactionRequestInfo', () => {
  const mockAccount: AccountMeta = { address: '0x123', type: AccountType.SignerMnemonic }
  const mockWrapGasFee: GasFeeResult = {
    value: '250000',
    params: {
      gasLimit: '250000',
      maxFeePerGas: '300000',
      maxPriorityFeePerGas: '350000',
    },
    isLoading: false,
    error: null,
  }
  const swapQueryResult = {
    data: {
      requestId: '123',
      swap: {
        from: '0x123',
        data: '0x',
        value: '0',
        to: '0xSwap',
        chainId: UniverseChainId.Mainnet,
        gasLimit: '500000',
        maxFeePerGas: '600000',
        maxPriorityFeePerGas: '700000',
      },
    },
    error: null,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should include gas fee values from wrapGasFee in the returned wrap transactionRequest', () => {
    // Swap needs wrapping
    const mockDerivedSwapInfo = createMockDerivedSwapInfo(ETH, WETH, '1000000000000000000', '1000000000', {
      wrapType: WrapType.Wrap,
    })
    mockUseWrapTransactionRequest.mockReturnValue({
      to: '0xWrap',
      chainId: UniverseChainId.Mainnet,
    })
    mockUsePermit2SignatureWithData.mockReturnValue({ signature: undefined, isLoading: false })
    mockUseTradingApiSwapQuery.mockReturnValue(swapQueryResult)
    mockUseTransactionGasFee.mockReturnValue(mockWrapGasFee)
    mockUseV4SwapEnabled.mockReturnValue(true)

    const { result } = renderHook(() =>
      useTransactionRequestInfo({
        derivedSwapInfo: mockDerivedSwapInfo,
        tokenApprovalInfo: createMockTokenApprovalInfo(),
        account: mockAccount,
        skip: false,
      }),
    )

    expect(result.current.transactionRequest).toMatchObject<providers.TransactionRequest>({
      to: '0xWrap',
      chainId: UniverseChainId.Mainnet,
      gasLimit: '250000',
      maxFeePerGas: '300000',
      maxPriorityFeePerGas: '350000',
    })
  })

  it('should return the swap transactionRequest when wrap is not applicable', () => {
    // Swap does not need wrapping
    const mockDerivedSwapInfo = createMockDerivedSwapInfo(ETH, WETH, '1000000000000000000', '1000000000')

    mockUseWrapTransactionRequest.mockReturnValue(null)
    mockUsePermit2SignatureWithData.mockReturnValue({ signature: undefined, isLoading: false })
    mockUseTradingApiSwapQuery.mockReturnValue(swapQueryResult)
    mockUseTransactionGasFee.mockReturnValue({ error: null, isLoading: false })
    mockUseV4SwapEnabled.mockReturnValue(true)

    const { result } = renderHook(() =>
      useTransactionRequestInfo({
        derivedSwapInfo: mockDerivedSwapInfo,
        tokenApprovalInfo: createMockTokenApprovalInfo(),
        account: mockAccount,
        skip: false,
      }),
    )

    expect(result.current.transactionRequest).toMatchObject<providers.TransactionRequest>({
      to: '0xSwap',
      chainId: UniverseChainId.Mainnet,
      gasLimit: '500000',
      maxFeePerGas: '600000',
      maxPriorityFeePerGas: '700000',
    })
  })
})
