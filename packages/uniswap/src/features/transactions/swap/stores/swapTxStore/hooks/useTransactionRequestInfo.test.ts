import { renderHook } from '@testing-library/react'
import type { providers } from 'ethers/lib/ethers'
import { useTradingApiSwapQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { initialTransactionSettingsState } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsStore'
import { useAllTransactionSettings } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import type { SwapData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import { usePermit2SignatureWithData } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/usePermit2Signature'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useTransactionRequestInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { ETH, WETH } from 'uniswap/src/test/fixtures'
import { createMockDerivedSwapInfo, createMockTokenApprovalInfo } from 'uniswap/src/test/fixtures/transactions/swap'

jest.mock('uniswap/src/data/apiClients/tradingApi/useTradingApiSwapQuery')
jest.mock('uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/usePermit2Signature')
jest.mock('uniswap/src/features/gas/hooks')
jest.mock('uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled')
jest.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => ({
    useAllTransactionSettings: jest.fn(),
  }),
)
jest.mock('@universe/gating', () => {
  return {
    ...jest.requireActual('@universe/gating'),
    useDynamicConfigValue: jest
      .fn()
      .mockImplementation(({ defaultValue }: { config: unknown; key: unknown; defaultValue: unknown }) => {
        return defaultValue
      }),
  }
})
jest.mock('uniswap/src/features/address/useIsSmartContractAddress')

const mockUseTradingApiSwapQuery = useTradingApiSwapQuery as jest.Mock
const mockUsePermit2SignatureWithData = usePermit2SignatureWithData as jest.Mock
const mockUseTransactionGasFee = useTransactionGasFee as jest.Mock
const mockUseV4SwapEnabled = useV4SwapEnabled as jest.Mock
const mockUseIsSmartContractAddress = useIsSmartContractAddress as jest.Mock
const mockUseAllTransactionSettings = useAllTransactionSettings as jest.Mock

describe('useTransactionRequestInfo', () => {
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
      transactions: [
        {
          from: '0x123',
          data: '0x',
          value: '0',
          to: '0xSwap',
          chainId: UniverseChainId.Mainnet,
          gasLimit: '500000',
          maxFeePerGas: '600000',
          maxPriorityFeePerGas: '700000',
        },
      ],
    } satisfies SwapData,
    error: null,
    isLoading: false,
  }

  const wrapQueryResult = {
    data: {
      requestId: '123',
      transactions: [
        {
          from: '0x123',
          data: '0x',
          value: '0',
          to: '0xWrap',
          chainId: UniverseChainId.Mainnet,
          gasLimit: '250000',
          maxFeePerGas: '300000',
          maxPriorityFeePerGas: '350000',
        },
      ],
    } satisfies SwapData,
    error: null,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSmartContractAddress.mockReturnValue({ loading: false, isSmartContractAddress: false })
    mockUseAllTransactionSettings.mockReturnValue({
      ...initialTransactionSettingsState,
      autoSlippageTolerance: undefined,
    })
  })

  it('should include gas fee values from wrapGasFee in the returned wrap transactionRequest', () => {
    // Swap needs wrapping
    const mockDerivedSwapInfo = createMockDerivedSwapInfo({
      inputCurrency: ETH,
      outputCurrency: WETH,
      inputAmount: '1000000000000000000',
      outputAmount: '1000000000',
      overrides: {
        wrapType: WrapType.Wrap,
      },
    })
    mockUsePermit2SignatureWithData.mockReturnValue({ signature: undefined, isLoading: false })
    mockUseTradingApiSwapQuery.mockReturnValue(wrapQueryResult)
    mockUseTransactionGasFee.mockReturnValue(mockWrapGasFee)
    mockUseV4SwapEnabled.mockReturnValue(true)

    const { result } = renderHook(() =>
      useTransactionRequestInfo({
        derivedSwapInfo: mockDerivedSwapInfo,
        tokenApprovalInfo: createMockTokenApprovalInfo(),
      }),
    )

    expect(result.current.txRequests?.[0]).toMatchObject<providers.TransactionRequest>({
      to: '0xWrap',
      chainId: UniverseChainId.Mainnet,
      gasLimit: '250000',
      maxFeePerGas: '300000',
      maxPriorityFeePerGas: '350000',
    })
  })

  it('should return the swap transactionRequest when wrap is not applicable', () => {
    // Swap does not need wrapping
    const mockDerivedSwapInfo = createMockDerivedSwapInfo({
      inputCurrency: ETH,
      outputCurrency: WETH,
      inputAmount: '1000000000000000000',
      outputAmount: '1000000000',
    })

    mockUsePermit2SignatureWithData.mockReturnValue({ signature: undefined, isLoading: false })
    mockUseTradingApiSwapQuery.mockReturnValue(swapQueryResult)
    mockUseTransactionGasFee.mockReturnValue({ error: null, isLoading: false })
    mockUseV4SwapEnabled.mockReturnValue(true)

    const { result } = renderHook(() =>
      useTransactionRequestInfo({
        derivedSwapInfo: mockDerivedSwapInfo,
        tokenApprovalInfo: createMockTokenApprovalInfo(),
      }),
    )

    expect(result.current.txRequests?.[0]).toMatchObject<providers.TransactionRequest>({
      to: '0xSwap',
      chainId: UniverseChainId.Mainnet,
      gasLimit: '500000',
      maxFeePerGas: '600000',
      maxPriorityFeePerGas: '700000',
    })
  })
})
