import 'utilities/src/logger/mocks'
import type { TransactionRequest } from '@ethersproject/abstract-provider'
import { DAI } from 'uniswap/src/constants/tokens'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UserRejectedRequestError as ViemUserRejectedRequestError } from 'viem'
import { vi } from 'vitest'
import { useSendCallback } from '~/features/Swap/hooks/useSendCallback'
import { useAccount } from '~/hooks/useAccount'
import { useEthersWeb3Provider } from '~/hooks/useEthersProvider'
import { useSelectChain } from '~/hooks/useSelectChain'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { renderHook } from '~/test-utils/render'
import { UserRejectedRequestError } from '~/utils/errors'

vi.mock('~/hooks/useAccount')
vi.mock('~/hooks/useEthersProvider')
vi.mock('~/hooks/useSelectChain')
vi.mock('uniswap/src/features/chains/hooks/useSupportedChainId')

vi.mock('~/state/transactions/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/state/transactions/hooks')>()
  return {
    ...actual,
    useTransactionAdder: () => vi.fn(),
  }
})

const useAccountMock = vi.mocked(useAccount)
const useEthersWeb3ProviderMock = vi.mocked(useEthersWeb3Provider)
const useSelectChainMock = vi.mocked(useSelectChain)
const useSupportedChainIdMock = vi.mocked(useSupportedChainId)

const RECIPIENT = '0x9984b4b4E408e8D618A879e5315BD30952c89103'
// Wallet is on Mainnet but the transfer targets Optimism, so the send path must switch chains first.
const TARGET_CHAIN = UniverseChainId.Optimism

function callbackArgs() {
  return {
    currencyAmount: tryParseCurrencyAmount('1', DAI) ?? undefined,
    recipient: RECIPIENT,
    transactionRequest: { chainId: TARGET_CHAIN } as TransactionRequest,
    gasFee: undefined,
  }
}

describe('useSendCallback', () => {
  const sendTransaction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useAccountMock.mockReturnValue({
      status: 'connected',
      chainId: UniverseChainId.Mainnet,
      connector: { type: 'mock' },
    } as any)
    useEthersWeb3ProviderMock.mockReturnValue({
      on: vi.fn(),
      off: vi.fn(),
      getSigner: () => ({ sendTransaction }),
    } as any)
    useSupportedChainIdMock.mockReturnValue(TARGET_CHAIN)
  })

  it('classifies a rejected network-switch prompt as a user cancellation', async () => {
    // useSelectChain rethrows viem's rejection when the caller opts in via { throwOnUserRejection: true }.
    const selectChain = vi.fn().mockRejectedValue(new ViemUserRejectedRequestError(new Error('User rejected')))
    useSelectChainMock.mockReturnValue(selectChain)

    const { result } = renderHook(() => useSendCallback(callbackArgs()))

    await expect(result.current()).rejects.toBeInstanceOf(UserRejectedRequestError)
    expect(selectChain).toHaveBeenCalledWith(TARGET_CHAIN, { throwOnUserRejection: true })
    // A cancellation must never reach the wallet's sendTransaction.
    expect(sendTransaction).not.toHaveBeenCalled()
  })

  it('throws a generic failure when the switch fails without a rejection', async () => {
    const selectChain = vi.fn().mockResolvedValue(false)
    useSelectChainMock.mockReturnValue(selectChain)

    const { result } = renderHook(() => useSendCallback(callbackArgs()))

    // Non-rejection switch failures stay generic errors (surfaced + logged), not cancellations.
    await expect(result.current()).rejects.not.toBeInstanceOf(UserRejectedRequestError)
    expect(sendTransaction).not.toHaveBeenCalled()
  })
})
