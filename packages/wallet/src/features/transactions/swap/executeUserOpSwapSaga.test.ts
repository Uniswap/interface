import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import type { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import type { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { tradeToTransactionInfo } from 'uniswap/src/features/transactions/swap/utils/trade'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import {
  createExecuteUserOpSwapSaga,
  type UserOpSwapParams,
} from 'wallet/src/features/transactions/swap/executeUserOpSwapSaga'
import {
  mockAnalytics,
  mockSignerAccount as account,
  mockTransactionSagaDependencies,
  mockTransactionService,
  prepareSwapTxContext,
} from 'wallet/src/features/transactions/swap/types/fixtures'
import { DelegationType } from 'wallet/src/features/transactions/types/transactionSagaDependencies'

vi.mock('wallet/src/features/transactions/factories/createTransactionServices')
vi.mock('uniswap/src/features/transactions/swap/utils/trade', async () => ({
  ...(await vi.importActual('uniswap/src/features/transactions/swap/utils/trade')),
  tradeToTransactionInfo: vi.fn(),
}))

const CHAIN_ID = UniverseChainId.Mainnet
const USER_OP_HASH = '0xuserophash'

const mockUserOp = { sender: '0x1111111111111111111111111111111111111111' } as unknown as RpcUserOperation<'0.8'>

// A classic swap context carrying an unsignedUserOperation passes `isUserOpSwap`.
const userOpSwapContext = {
  ...prepareSwapTxContext(),
  unsignedUserOperation: mockUserOp,
  requestUniswapGasSponsorship: true,
} as unknown as ValidatedSwapTxContext

function createParams(): UserOpSwapParams {
  return {
    address: account.address,
    analytics: mockAnalytics,
    swapTxContext: userOpSwapContext,
    caip25Info: undefined,
    setCurrentStep: vi.fn(),
    setSteps: vi.fn(),
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    onPending: vi.fn(),
    onClearForm: vi.fn(),
  }
}

describe('executeUserOpSwapSaga', () => {
  const executeUserOpSwap = createExecuteUserOpSwapSaga(mockTransactionSagaDependencies)

  const sharedProviders: (EffectProviders | StaticProvider)[] = [
    [
      call(createTransactionServices, mockTransactionSagaDependencies, {
        account: { address: account.address, type: AccountType.SignerMnemonic },
        chainId: CHAIN_ID,
        submitViaPrivateRpc: false,
        delegationType: DelegationType.Auto,
        includeUserOpServices: true,
      }),
      { transactionService: mockTransactionService },
    ],
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockTransactionService.executeUserOp.mockResolvedValue({ userOpHash: USER_OP_HASH })
    vi.mocked(tradeToTransactionInfo).mockReturnValue({ type: TransactionType.Swap } as ReturnType<
      typeof tradeToTransactionInfo
    >)
  })

  it('submits via transactionService.executeUserOp and does not dispatch addTransaction itself', async () => {
    const params = createParams()

    await expectSaga(executeUserOpSwap, params)
      .provide(sharedProviders)
      .put(pushNotification({ type: AppNotificationType.TransactionPending, chainId: CHAIN_ID }))
      .call(params.onSuccess)
      .not.put.actionType(addTransaction.type)
      .run()

    expect(mockTransactionService.executeUserOp).toHaveBeenCalledWith(
      expect.objectContaining({
        userOp: mockUserOp,
        chainId: CHAIN_ID,
        requestUniswapGasSponsorship: true,
        analytics: mockAnalytics,
      }),
    )
  })

  it('calls onFailure when executeUserOp throws', async () => {
    const params = createParams()
    mockTransactionService.executeUserOp.mockRejectedValue(new Error('bundler rejected'))

    await expectSaga(executeUserOpSwap, params)
      .provide(sharedProviders)
      .call(params.onFailure)
      .not.call(params.onSuccess)
      .run()
  })
})
