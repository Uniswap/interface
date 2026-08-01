import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { expectSaga } from 'redux-saga-test-plan'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NotificationState, pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import {
  ApproveTransactionInfo,
  ExactOutputSwapTransactionInfo,
  PlanTransactionInfo,
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  UnknownTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { finalizedTransactionAction } from 'uniswap/src/test/fixtures'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { pushTransactionNotification } from 'wallet/src/features/notifications/notificationWatcherSaga'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

// `vi.hoisted` runs before the hoisted `vi.mock` factories below, so these are
// always initialized by the time the factories (and their getters) execute.
const { mockIsMobileApp, mockIsEarnEnabled } = vi.hoisted(() => ({
  mockIsMobileApp: { value: true },
  mockIsEarnEnabled: vi.fn(() => true),
}))

vi.mock('@universe/environment', async () => {
  const mocked: Record<string, unknown> = { ...(await vi.importActual('@universe/environment')) }
  // Use `defineProperty` (not an inline spread value) so `isMobileApp` reads
  // `mockIsMobileApp.value` lazily on each access instead of snapshotting it.
  Object.defineProperty(mocked, 'isMobileApp', {
    get: (): boolean => mockIsMobileApp.value,
  })
  return mocked
})

vi.mock('uniswap/src/features/earn/hooks/useIsEarnEnabled', () => ({
  getIsEarnEnabled: () => mockIsEarnEnabled(),
}))

const finalizedTxAction = finalizedTransactionAction()
const account = signerMnemonicAccount()

const txId = 'uuid-4'

// oxlint-disable-next-line jest/no-export -- suppressed
export const createFinalizedTxAction = (typeInfo: TransactionTypeInfo): ReturnType<typeof finalizeTransaction> => ({
  payload: {
    ...finalizedTxAction.payload,
    typeInfo,
    id: txId,
    addedTime: Date.now(),
  },
  type: 'transactions/finalizeTransaction',
})

describe(pushTransactionNotification, () => {
  const initialNotificationsState: NotificationState = {
    notificationQueue: [],
    notificationStatus: {},
    lastTxNotificationUpdate: {},
  }

  beforeEach(() => {
    mockIsMobileApp.value = true
    mockIsEarnEnabled.mockReturnValue(true)
  })

  it('Handles approve transactions', () => {
    const approveTypeInfo: ApproveTransactionInfo = {
      type: TransactionType.Approve,
      tokenAddress: '0xUniswapToken',
      spender: '0xUniswapDeployer',
    }
    const finalizedApproveAction = createFinalizedTxAction(approveTypeInfo)
    const { chainId, from } = finalizedApproveAction.payload

    return expectSaga(pushTransactionNotification, finalizedApproveAction)
      .withState({
        transactions: {
          [from]: {
            [chainId]: {
              uuid1: { typeInfo: TransactionType.Approve, addedTime: Date.now() },
              uuid2: { typeInfo: TransactionType.Swap, addedTime: Date.now() + 3000 },
            },
          },
        },
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Approve,
          tokenAddress: approveTypeInfo.tokenAddress,
          spender: approveTypeInfo.spender,
          tokenSymbol: approveTypeInfo.tokenSymbol,
          txId,
        }),
      )
      .silentRun()
  })

  it('Suppresses approve notification if a swap was also submited within 3 seconds', () => {
    const approveTypeInfo: ApproveTransactionInfo = {
      type: TransactionType.Approve,
      tokenAddress: '0xUniswapToken',
      spender: '0xUniswapDeployer',
    }
    const finalizedApproveAction = createFinalizedTxAction(approveTypeInfo)
    const { chainId, from } = finalizedApproveAction.payload

    return expectSaga(pushTransactionNotification, finalizedApproveAction)
      .withState({
        transactions: {
          [from]: {
            [chainId]: {
              uuid1: { typeInfo: TransactionType.Approve, addedTime: Date.now() },
              uuid2: { typeInfo: TransactionType.Swap, addedTime: Date.now() + 2000 },
            },
          },
        },
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .silentRun()
  })

  it('Handles swap transactions', () => {
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId: '1-0x4d224452801ACEd8B2F0aebE155379bb5D594381',
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from } = finalizedSwapAction.payload

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId: swapTypeInfo.outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        }),
      )
      .silentRun()
  })

  it('adds an Earn upsell notification for eligible finalized swaps on mobile', () => {
    const outputCurrencyId = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId,
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
      transactedUSDValue: 123,
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from, id } = finalizedSwapAction.payload

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        }),
      )
      .put(
        pushNotification({
          type: AppNotificationType.EarnSwapUpsell,
          address: from,
          outputCurrencyId,
          swapAmountUsd: 123,
          transactionId: id,
        }),
      )
      .silentRun()
  })

  it('does not add a duplicate Earn upsell notification for the same transaction on mobile', () => {
    const outputCurrencyId = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId,
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
      transactedUSDValue: 123,
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from, id } = finalizedSwapAction.payload

    const duplicateEarnUpsellNotification = pushNotification({
      type: AppNotificationType.EarnSwapUpsell,
      address: from,
      outputCurrencyId,
      swapAmountUsd: 123,
      transactionId: id,
    })

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .withState({
        notifications: {
          ...initialNotificationsState,
          notificationQueue: [duplicateEarnUpsellNotification.payload],
        },
        wallet: {
          activeAccountAddress: from,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        }),
      )
      .not.put(duplicateEarnUpsellNotification)
      .silentRun()
  })

  it('does not add an Earn upsell notification on non-mobile platforms', () => {
    mockIsMobileApp.value = false

    const outputCurrencyId = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId,
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
      transactedUSDValue: 123,
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from, id } = finalizedSwapAction.payload

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        }),
      )
      .not.put(
        pushNotification({
          type: AppNotificationType.EarnSwapUpsell,
          address: from,
          outputCurrencyId,
          swapAmountUsd: 123,
          transactionId: id,
        }),
      )
      .silentRun()
  })

  it('does not add an Earn upsell notification when Earn is disabled', () => {
    mockIsEarnEnabled.mockReturnValue(false)

    const outputCurrencyId = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
    const swapTypeInfo: ExactOutputSwapTransactionInfo = {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId,
      outputCurrencyAmountRaw: '230000000000000000',
      expectedInputCurrencyAmountRaw: '12000000000000000',
      maximumInputCurrencyAmountRaw: '12000000000000000',
    }
    const finalizedSwapAction = createFinalizedTxAction(swapTypeInfo)
    const { chainId, from, id } = finalizedSwapAction.payload

    return expectSaga(pushTransactionNotification, finalizedSwapAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Swap,
          inputCurrencyId: swapTypeInfo.inputCurrencyId,
          outputCurrencyId,
          inputCurrencyAmountRaw: swapTypeInfo.expectedInputCurrencyAmountRaw,
          outputCurrencyAmountRaw: swapTypeInfo.outputCurrencyAmountRaw,
          tradeType: swapTypeInfo.tradeType,
          txId,
        }),
      )
      .not.put(
        pushNotification({
          type: AppNotificationType.EarnSwapUpsell,
          address: from,
          outputCurrencyId,
          transactionId: id,
        }),
      )
      .silentRun()
  })

  it('Handles sending currency', () => {
    const sendCurrencyTypeInfo: SendTokenTransactionInfo = {
      type: TransactionType.Send,
      assetType: AssetType.Currency,
      currencyAmountRaw: '1000',
      recipient: '0x123abc456def',
      tokenAddress: '0xUniswapToken',
    }
    const finalizedSendCurrencyAction = createFinalizedTxAction(sendCurrencyTypeInfo)
    const { chainId, from } = finalizedSendCurrencyAction.payload

    return expectSaga(pushTransactionNotification, finalizedSendCurrencyAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.Currency,
          tokenAddress: sendCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          recipient: sendCurrencyTypeInfo.recipient,
          txId,
        }),
      )
      .silentRun()
  })

  it('Handles sending NFTs', () => {
    const sendNftTypeInfo: SendTokenTransactionInfo = {
      type: TransactionType.Send,
      assetType: AssetType.ERC721,
      recipient: '0x123abc456def',
      tokenAddress: '0xUniswapToken',
      tokenId: '420',
    }
    const finalizedSendNftAction = createFinalizedTxAction(sendNftTypeInfo)
    const { chainId, from } = finalizedSendNftAction.payload

    return expectSaga(pushTransactionNotification, finalizedSendNftAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Send,
          assetType: AssetType.ERC721,
          tokenAddress: sendNftTypeInfo.tokenAddress,
          tokenId: '420',
          recipient: sendNftTypeInfo.recipient,
          txId,
        }),
      )
      .silentRun()
  })

  it('Handles receiving currency', () => {
    const receiveCurrencyTypeInfo: ReceiveTokenTransactionInfo = {
      type: TransactionType.Receive,
      assetType: AssetType.Currency,
      currencyAmountRaw: '1000',
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
    }
    const finalizedReceiveCurrencyAction = createFinalizedTxAction(receiveCurrencyTypeInfo)
    const { chainId, from } = finalizedReceiveCurrencyAction.payload

    return expectSaga(pushTransactionNotification, finalizedReceiveCurrencyAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.Currency,
          tokenAddress: receiveCurrencyTypeInfo.tokenAddress,
          currencyAmountRaw: '1000',
          sender: receiveCurrencyTypeInfo.sender,
          txId,
        }),
      )
      .silentRun()
  })

  it('Handles receiving NFTs', () => {
    const receiveNftTypeInfo: ReceiveTokenTransactionInfo = {
      type: TransactionType.Receive,
      assetType: AssetType.ERC1155,
      sender: '0x000123abc456def',
      tokenAddress: '0xUniswapToken',
      tokenId: '420',
    }
    const finalizedReceiveNftAction = createFinalizedTxAction(receiveNftTypeInfo)
    const { chainId, from } = finalizedReceiveNftAction.payload

    return expectSaga(pushTransactionNotification, finalizedReceiveNftAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Receive,
          assetType: AssetType.ERC1155,
          tokenAddress: receiveNftTypeInfo.tokenAddress,
          tokenId: '420',
          sender: receiveNftTypeInfo.sender,
          txId,
        }),
      )
      .silentRun()
  })

  it('uses the Earn vault-step amount for plan notifications', () => {
    const vaultAddress = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
    const usdcCurrencyId = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
    const vaultStep: TransactionDetails = {
      id: 'vault-step',
      chainId: UniverseChainId.Mainnet,
      routing: TradingApi.Routing.CHAINED,
      from: account.address,
      transactionOriginType: TransactionOriginType.Internal,
      typeInfo: {
        type: TransactionType.Deposit,
        assetType: AssetType.Currency,
        tokenAddress: USDC_MAINNET.address,
        currencyAmountRaw: '1900000',
        isVault: true,
        vaultAddress,
      },
      status: TransactionStatus.Success,
      addedTime: 1,
      updatedTime: 1,
      options: { request: {} },
    }
    const planTypeInfo: PlanTransactionInfo = {
      type: TransactionType.Plan,
      planId: 'plan-id',
      planStatus: TradingApi.PlanStatus.COMPLETED,
      stepDetails: [vaultStep],
      tokenOutChainId: UniverseChainId.Mainnet,
      inputCurrencyId: `1-${getNativeAddress(UniverseChainId.Mainnet)}`,
      outputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, vaultAddress),
      inputCurrencyAmountRaw: '1000000000000000000',
      outputCurrencyAmountRaw: '1800000000000000000',
      tradeType: TradeType.EXACT_INPUT,
      transactionHashes: [],
      earnAction: TradingApi.EarnAction.DEPOSIT,
    }
    const finalizedPlanAction = createFinalizedTxAction(planTypeInfo)
    const { chainId, from } = finalizedPlanAction.payload

    return expectSaga(pushTransactionNotification, finalizedPlanAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Plan,
          inputCurrencyId: usdcCurrencyId,
          outputCurrencyId: usdcCurrencyId,
          inputCurrencyAmountRaw: '1900000',
          outputCurrencyAmountRaw: '1900000',
          earnAction: TradingApi.EarnAction.DEPOSIT,
          txId,
        }),
      )
      .silentRun()
  })

  it('Handles an unknown tranasction', () => {
    const unknownTxTypeInfo: UnknownTransactionInfo = {
      type: TransactionType.Unknown,
      tokenAddress: '0xUniswapToken',
    }
    const finalizedUnknownAction = createFinalizedTxAction(unknownTxTypeInfo)
    const { chainId, from } = finalizedUnknownAction.payload

    return expectSaga(pushTransactionNotification, finalizedUnknownAction)
      .withState({
        notifications: initialNotificationsState,
        wallet: {
          activeAccountAddress: account.address,
        },
      })
      .put(
        pushNotification({
          txStatus: TransactionStatus.Success,
          address: from,
          chainId,
          type: AppNotificationType.Transaction,
          txType: TransactionType.Unknown,
          tokenAddress: unknownTxTypeInfo.tokenAddress,
          txId,
        }),
      )
      .silentRun()
  })
})
