import { MaxUint256 } from '@ethersproject/constants'
import { AnyAction, createAction } from '@reduxjs/toolkit'
import { BigNumber, providers } from 'ethers'
import { Dispatch } from 'react'
import ERC20_ABI from 'src/abis/erc20.json'
import { Erc20 } from 'src/abis/types'
import { appSelect } from 'src/app/hooks'
import { getContractManager, getProvider } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { GAS_INFLATION_FACTOR } from 'src/constants/gas'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { FeeType } from 'src/features/gas/types'
import { updateGasEstimates } from 'src/features/transactions/transactionState/transactionState'
import { TransactionType } from 'src/features/transactions/types'
import { selectActiveAccountAddress } from 'src/features/wallet/selectors'
import { isNativeCurrencyAddress } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { call, takeEvery } from 'typed-redux-saga'

export type GasEstimateParams = ApproveGasEstimateParmams | SwapGasEstimateParams

interface BaseGasEstimateParams {
  txType: TransactionType
  chainId: ChainId
  transactionStateDispatch: Dispatch<AnyAction>
}

export interface ApproveGasEstimateParmams extends BaseGasEstimateParams {
  txType: TransactionType.Approve
  tokenAddress: string
  txAmount: string
}

export interface SwapGasEstimateParams extends BaseGasEstimateParams {
  txType: TransactionType.Swap
  callData: string
  gasUseEstimate: string
  value?: string
}

export const estimateGasAction = createAction<GasEstimateParams>('estimateGas/trigger')

export function* estimateGasWatcher() {
  yield* takeEvery(estimateGasAction, estimateGas)
}

export function* estimateGas({ payload }: ReturnType<typeof estimateGasAction>) {
  const address = yield* appSelect(selectActiveAccountAddress)
  if (!address) return

  const { txType, chainId, transactionStateDispatch } = payload
  const provider = yield* call(getProvider, chainId)
  const swapRouterAddress = SWAP_ROUTER_ADDRESSES[chainId]

  switch (txType) {
    case TransactionType.Approve:
      const { tokenAddress, txAmount } = payload
      yield* call(
        estimateApproveGasLimit,
        address,
        chainId,
        provider,
        tokenAddress,
        swapRouterAddress,
        txAmount,
        transactionStateDispatch
      )
      break
    case TransactionType.Swap:
      const { callData, gasUseEstimate, value } = payload
      yield* call(
        estimateSwapGasInfo,
        chainId,
        address,
        swapRouterAddress,
        callData,
        gasUseEstimate,
        value,
        provider as providers.JsonRpcProvider,
        transactionStateDispatch
      )
      break
  }
}

function* estimateApproveGasLimit(
  address: Address,
  chainId: ChainId,
  provider: providers.Provider,
  tokenAddress: Address,
  spender: Address,
  txAmount: string,
  transactionStateDispatch: Dispatch<AnyAction>
) {
  if (isNativeCurrencyAddress(tokenAddress)) {
    transactionStateDispatch(
      updateGasEstimates({ gasEstimates: { [TransactionType.Approve]: '0' } })
    )
    return
  }

  const contractManager = yield* call(getContractManager)
  const tokenContract = contractManager.getOrCreateContract<Erc20>(
    chainId,
    tokenAddress,
    provider,
    ERC20_ABI
  )

  const allowance = yield* call(tokenContract.allowance, address, spender)
  if (allowance.gt(txAmount)) {
    transactionStateDispatch(
      updateGasEstimates({ gasEstimates: { [TransactionType.Approve]: '0' } })
    )
    return
  }

  let amountToApprove = MaxUint256
  let approveGasEstimate: BigNumber
  try {
    approveGasEstimate = yield* call(tokenContract.estimateGas.approve, spender, amountToApprove, {
      from: address,
    })
  } catch (error) {
    logger.info(
      'hooks',
      'getApproveGasLimit',
      'Gas estimation for approve max amount failed (token may restrict approval amounts). Attempting to approve exact'
    )
    approveGasEstimate = yield* call(
      tokenContract.estimateGas.approve,
      spender,
      BigNumber.from(txAmount),
      {
        from: address,
      }
    )
  }

  transactionStateDispatch(
    updateGasEstimates({
      gasEstimates: {
        [TransactionType.Approve]: approveGasEstimate.mul(GAS_INFLATION_FACTOR).toString(),
      },
    })
  )
}

function* estimateSwapGasInfo(
  chainId: ChainId,
  address: Address,
  spender: Address,
  callData: string,
  gasUseEstimate: string,
  value: string | undefined,
  provider: providers.JsonRpcProvider,
  transactionStateDispatch: Dispatch<AnyAction>
) {
  const valueObject = !value || isZero(value) ? {} : { value }
  const tx: providers.TransactionRequest = {
    from: address,
    to: spender,
    data: callData,
    ...valueObject,
  }

  const swapGasInfo = yield* call(computeGasFee, chainId, tx, provider, gasUseEstimate)
  const gasPrice =
    swapGasInfo.type === FeeType.Eip1559
      ? BigNumber.from(swapGasInfo.feeDetails.currentBaseFeePerGas)
          .add(swapGasInfo.feeDetails.maxPriorityFeePerGas.normal)
          .toString()
      : swapGasInfo.gasPrice

  transactionStateDispatch(
    updateGasEstimates({
      gasEstimates: {
        [TransactionType.Swap]: swapGasInfo.gasLimit,
      },
      gasPrice,
    })
  )
}
