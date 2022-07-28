import { MaxUint256 } from '@ethersproject/constants'
import { AnyAction, createAction } from '@reduxjs/toolkit'
import { SwapRouter } from '@uniswap/router-sdk'
import { BigNumber, providers } from 'ethers'
import { Dispatch } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { appSelect } from 'src/app/hooks'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { getGasAfterInflation, getGasPrice } from 'src/features/gas/utils'
import { PermitOptions, signPermitMessage } from 'src/features/transactions/approve/permitSaga'
import { PERMITTABLE_TOKENS } from 'src/features/transactions/approve/permittableTokens'
import { DEFAULT_SLIPPAGE_TOLERANCE_PERCENT } from 'src/features/transactions/swap/hooks'
import { Trade } from 'src/features/transactions/swap/useTrade'
import {
  setExactApproveRequired,
  updateGasEstimates,
  updateSwapMethodParamaters,
} from 'src/features/transactions/transactionState/transactionState'
import { createTransactionRequest } from 'src/features/transactions/transfer/transferTokenSaga'
import { TransferTokenParams } from 'src/features/transactions/transfer/types'
import { TransactionType } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { currencyAddress, isNativeCurrencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { call, takeEvery } from 'typed-redux-saga'

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
          estimateApproveGasLimit,
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
              [TransactionType.Approve]: approveData.gasEstimates[TransactionType.Approve],
              [TransactionType.Swap]: swapData.gasEstimates[TransactionType.Swap],
            },
            gasPrice: swapData.gasPrice,
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
              [TransactionType.Send]: transferData.gasEstimates[TransactionType.Send],
            },
            gasPrice: transferData.gasPrice,
          })
        )
        break
      }
    }
  } catch (error) {
    logger.error('estimateGasSaga', 'estimateGas', 'Failed:', error)
  }
}

function* estimateApproveGasLimit(params: EstiamteApproveGasInfo) {
  const { address, chainId, provider, tokenAddress, spender, txAmount } = params
  let exactApproveRequired = false

  if (isNativeCurrencyAddress(tokenAddress)) {
    return {
      allowance: MaxUint256,
      exactApproveRequired,
      gasEstimates: { [TransactionType.Approve]: '0' },
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
    return { allowance, exactApproveRequired, gasEstimates: { [TransactionType.Approve]: '0' } }
  }

  let approveGasEstimate: BigNumber

  try {
    const amountToApprove = MaxUint256
    approveGasEstimate = yield* call(tokenContract.estimateGas.approve, spender, amountToApprove, {
      from: address,
    })
  } catch (error) {
    logger.info(
      'hooks',
      'getApproveGasLimit',
      'Gas estimation for approve max amount failed (token may restrict approval amounts). Attempting to approve exact amount'
    )
    const amountToApprove = BigNumber.from(txAmount)
    approveGasEstimate = yield* call(tokenContract.estimateGas.approve, spender, amountToApprove, {
      from: address,
    })

    exactApproveRequired = true
  }

  return {
    allowance,
    exactApproveRequired,
    gasEstimates: {
      [TransactionType.Approve]: getGasAfterInflation(approveGasEstimate),
    },
  }
}

function* estimateTransferGasLimit(provider: providers.Provider, params: TransferTokenParams) {
  const { chainId } = params

  const transferRequest: providers.TransactionRequest = yield* call(
    createTransactionRequest,
    params
  )

  const transferGasInfo = yield* call(
    computeGasFee,
    chainId,
    transferRequest,
    provider as providers.JsonRpcProvider
  )

  const gasPrice = getGasPrice(transferGasInfo)

  return {
    gasEstimates: {
      [TransactionType.Send]: getGasAfterInflation(transferGasInfo.gasLimit),
    },
    gasPrice,
  }
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

  const swapGasInfo = yield* call(
    computeGasFee,
    chainId,
    tx,
    provider as providers.JsonRpcProvider,
    // TODO: remove hardcoded value and uncomment trade quote gas estimate when endpoint is updated
    // Using a conservative 300,000 fallback gasLimit until then
    '300000'
    // trade.quote.gasUseEstimate
  )
  const gasPrice = getGasPrice(swapGasInfo)

  const methodParameters = calldata && value ? { calldata, value } : undefined

  return {
    gasEstimates: {
      [TransactionType.Swap]: getGasAfterInflation(swapGasInfo.gasLimit),
    },
    gasPrice,
    methodParameters,
  }
}
