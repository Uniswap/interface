import { MaxUint256 } from '@ethersproject/constants'
import { AnyAction, createAction } from '@reduxjs/toolkit'
import { SwapRouter } from '@uniswap/router-sdk'
import { BigNumber, PopulatedTransaction, providers } from 'ethers'
import { Dispatch } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { appSelect } from 'src/app/hooks'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { PermitOptions, signPermitMessage } from 'src/features/transactions/approve/permitSaga'
import { PERMITTABLE_TOKENS } from 'src/features/transactions/approve/permittableTokens'
import { DEFAULT_SLIPPAGE_TOLERANCE_PERCENT } from 'src/features/transactions/swap/hooks'
import { Trade } from 'src/features/transactions/swap/useTrade'
import {
  setExactApproveRequired,
  updateGasEstimates,
  updateOptimismL1Fee,
  updateSwapMethodParamaters,
} from 'src/features/transactions/transactionState/transactionState'
import { prepareTransfer } from 'src/features/transactions/transfer/transferTokenSaga'
import { TransferTokenParams } from 'src/features/transactions/transfer/types'
import { TransactionType } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { currencyAddress, isNativeCurrencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { call, takeEvery } from 'typed-redux-saga'

// TODO: remove hardcoded L1 estimates when trade route endpoint can provide accurate Optimism gas estimation
const OPTIMISM_L1_GAS_LIMIT_ESTIMATES: Partial<Record<TransactionType, string>> = {
  [TransactionType.Approve]: '5000',
  [TransactionType.Swap]: '7200',
}

// TODO: remove hardcoded values and use gas estimate from trade quote endpoint once
// it is updated. Until then, using conservative values to ensure swaps succeeed
const SWAP_GAS_LIMIT_FALLBACKS: Record<ChainId, string> = {
  [ChainId.Mainnet]: '420000',
  [ChainId.Rinkeby]: '420000',
  [ChainId.Ropsten]: '420000',
  [ChainId.Goerli]: '420000',
  [ChainId.Kovan]: '420000',
  [ChainId.Optimism]: '420000',
  [ChainId.OptimisticKovan]: '420000',
  [ChainId.Polygon]: '420000',
  [ChainId.PolygonMumbai]: '420000',
  [ChainId.ArbitrumOne]: '1200000',
  [ChainId.ArbitrumRinkeby]: '1200000',
}

export type GasEstimateParams = SwapGasEstimateParams | TransferGasEstimateParams

export interface SwapGasEstimateParams {
  txType: TransactionType.Swap
  trade: Trade
  transactionStateDispatch: Dispatch<AnyAction>
}

export interface TransferGasEstimateParams {
  txType: TransactionType.Send
  params: TransferTokenParams
  transactionStateDispatch: Dispatch<AnyAction>
}

interface EstimateGasInfoBase {
  address: Address
  chainId: ChainId
  provider: providers.Provider
}

interface EstiamteApproveGasInfo extends EstimateGasInfoBase {
  spender: Address
  tokenAddress: Address
  txAmount: string
}

interface EstimateSwapGasInfo extends EstimateGasInfoBase {
  spender: Address
  trade: Trade
  permitOptions: PermitOptions | undefined
}

export const estimateGasAction = createAction<GasEstimateParams>('estimateGas/trigger')

export function* estimateGasWatcher() {
  yield* takeEvery(estimateGasAction, estimateGas)
}

export function* estimateGas({ payload }: ReturnType<typeof estimateGasAction>) {
  try {
    const address = yield* appSelect(selectActiveAccountAddress)
    if (!address) throw new Error('No active address. This should never happen')

    switch (payload.txType) {
      case TransactionType.Swap: {
        const { trade, transactionStateDispatch } = payload
        if (!trade.quote) throw new Error('No trade quote provided by the router endpoint')

        const chainId = trade.inputAmount.currency.chainId
        const provider = yield* call(getProvider, chainId)

        const tokenAddress = currencyAddress(trade.inputAmount.currency)
        const spender = SWAP_ROUTER_ADDRESSES[chainId]
        const txAmount = trade.quote.amount

        const { allowance, exactApproveRequired, ...approveData } = yield* call(
          estimateApproveGasFee,
          {
            address,
            chainId,
            provider,
            tokenAddress,
            spender,
            txAmount,
          }
        )

        const permitOptions = yield* call(signPermitMessage, {
          address,
          chainId,
          tokenAddress,
          spender,
          txAmount,
          allowance,
        })

        const swapData = yield* call(estimateSwapGasInfo, {
          address,
          chainId,
          trade,
          spender,
          permitOptions,
          provider,
        })

        transactionStateDispatch(setExactApproveRequired(exactApproveRequired))
        transactionStateDispatch(updateSwapMethodParamaters(swapData.methodParameters))
        transactionStateDispatch(
          updateGasEstimates({
            gasEstimates: {
              [TransactionType.Approve]: approveData.gasFeeEstimate[TransactionType.Approve],
              [TransactionType.Swap]: swapData.gasFeeEstimate[TransactionType.Swap],
            },
          })
        )
        transactionStateDispatch(
          updateOptimismL1Fee({
            optimismL1Fee: {
              [TransactionType.Approve]: approveData.optimismL1Fee,
              [TransactionType.Swap]: swapData.optimismL1Fee,
            },
          })
        )

        break
      }
      case TransactionType.Send: {
        const { params, transactionStateDispatch } = payload
        const provider = yield* call(getProvider, params.chainId)

        const transferData = yield* call(estimateTransferGasLimit, provider, params)

        transactionStateDispatch(
          updateGasEstimates({
            gasEstimates: {
              [TransactionType.Send]: transferData.gasFeeEstimate[TransactionType.Send],
            },
          })
        )
        break
      }
    }
  } catch (error) {
    logger.error('estimateGasSaga', 'estimateGas', 'Failed:', error)
  }
}

function* estimateApproveGasFee(params: EstiamteApproveGasInfo) {
  const { address, chainId, provider, tokenAddress, spender, txAmount } = params
  let exactApproveRequired = false

  if (isNativeCurrencyAddress(tokenAddress)) {
    return {
      allowance: MaxUint256,
      exactApproveRequired,
      gasFeeEstimate: { [TransactionType.Approve]: null },
    }
  }

  const contractManager = yield* call(getContractManager)
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    tokenAddress,
    provider,
    ERC20_ABI
  )

  const allowance = yield* call(tokenContract.allowance, address, spender)

  if (allowance.gt(txAmount) || PERMITTABLE_TOKENS[chainId]?.[tokenAddress]) {
    return { allowance, exactApproveRequired, gasFeeEstimate: { [TransactionType.Approve]: null } }
  }

  let tx: PopulatedTransaction

  try {
    const amountToApprove = MaxUint256
    tx = yield* call(tokenContract.populateTransaction.approve, spender, amountToApprove, {
      from: address,
    })
  } catch (error) {
    logger.info(
      'hooks',
      'getApproveGasLimit',
      'Gas estimation for approve max amount failed (token may restrict approval amounts). Attempting to approve exact amount'
    )
    const amountToApprove = BigNumber.from(txAmount)
    tx = yield* call(tokenContract.populateTransaction.approve, spender, amountToApprove, {
      from: address,
    })

    exactApproveRequired = true
  }

  const approveGasInfo = yield* call(
    computeGasFee,
    chainId,
    tx,
    provider as providers.JsonRpcProvider
  )
  const optimismL1Fee = yield* call(estimateOptimismL1Fee, chainId, TransactionType.Approve)

  return {
    allowance,
    exactApproveRequired,
    gasFeeEstimate: { [TransactionType.Approve]: approveGasInfo },
    optimismL1Fee,
  }
}

function* estimateTransferGasLimit(provider: providers.Provider, params: TransferTokenParams) {
  const { chainId } = params

  const { transferTxRequest } = yield* call(prepareTransfer, params, true)

  const transferGasInfo = yield* call(
    computeGasFee,
    chainId,
    transferTxRequest,
    provider as providers.JsonRpcProvider
  )

  return { gasFeeEstimate: { [TransactionType.Send]: transferGasInfo } }
}

function* estimateSwapGasInfo(params: EstimateSwapGasInfo) {
  const { address, chainId, trade, spender, permitOptions, provider } = params
  if (!trade.quote?.methodParameters) {
    throw new Error('Trade quote methodParameters were not provided by the router endpoint')
  }

  let { calldata, value } = trade.quote.methodParameters

  if (permitOptions) {
    // eslint-disable-next-line no-extra-semi
    ;({ calldata, value } = SwapRouter.swapCallParameters(trade, {
      slippageTolerance: DEFAULT_SLIPPAGE_TOLERANCE_PERCENT,
      recipient: address,
      inputTokenPermit: permitOptions,
    }))
  }

  const valueObject = !value || isZero(value) ? {} : { value }
  const tx: providers.TransactionRequest = {
    from: address,
    to: spender,
    data: calldata,
    ...valueObject,
  }

  const gasFallbackValue = SWAP_GAS_LIMIT_FALLBACKS[chainId]

  const swapGasInfo = yield* call(
    computeGasFee,
    chainId,
    tx,
    provider as providers.JsonRpcProvider,
    gasFallbackValue
    // trade.quote.gasUseEstimate
  )

  const methodParameters = calldata && value ? { calldata, value } : undefined

  const optimismL1Fee = yield* call(estimateOptimismL1Fee, chainId, TransactionType.Swap)

  return {
    gasFeeEstimate: { [TransactionType.Swap]: swapGasInfo },
    methodParameters,
    optimismL1Fee,
  }
}

// TODO: remove when trade route endpoint can provide accurate Optimism gas estimation
// Also worth looking into Optimism SDK but encountered build errors with the package
function* estimateOptimismL1Fee(chainId: ChainId, txType: TransactionType) {
  if (chainId !== ChainId.Optimism) {
    return undefined
  }

  const provider = yield* call(getProvider, ChainId.Mainnet)
  const gasPrice = yield* call([provider, provider.getGasPrice])
  const gasLimit = OPTIMISM_L1_GAS_LIMIT_ESTIMATES[txType]
  if (!gasLimit) {
    throw new Error(
      `Need to add hardcoded Optimism gasLimit estimate for tx type ${txType} to the const`
    )
  }

  const optimismL1Fee = gasPrice.mul(gasLimit).toString()
  return optimismL1Fee
}
