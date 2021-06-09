import { BigNumber, utils } from 'ethers'
import { GasPrice } from './reducer'
import { AppState } from '..'
import { useSelector } from 'react-redux'
import { CurrencyAmount } from '@uniswap/sdk'

export function getLatestGasPrice(): string {
  // const state = useSelector<AppState, AppState['gasprice']>((state) => state.gasprice)
  const fast = '10'
  const third = BigNumber.from(fast).div(3)

  // Add 1/3 onto the gas price...
  return BigNumber.from(fast).add(third).toString()
}

export function isOutputSufficientToPayFee(
  amountIn: CurrencyAmount,
  outputWithSlippage: CurrencyAmount,
  gasPrice: GasPrice
) {
  const input = utils.parseEther(amountIn.toSignificant(6)!)
  const output = utils.parseEther(outputWithSlippage.toSignificant(6)!)
  const { largestFeeEstimate, largestEstimateInGwei } = estimateGasCosts(gasPrice)
  // Whitelisted outputs
  // We can look up the exchange rate and make a judgement

  const gwei = BigNumber.from(largestEstimateInGwei).div(10).mul(2)

  if (BigNumber.from(input).lt(utils.parseEther(gwei.toString()))) {
    return 'You must swap at least ' + gwei.toString() + ' ' + amountIn.currency.symbol
  }

  if (BigNumber.from(output).lte(largestFeeEstimate)) {
    return amountIn.currency.symbol + ' not sufficient to cover transaction fee'
  }

  return null
}

export function useGasPriceState(): AppState['gasprice'] {
  return useSelector<AppState, AppState['gasprice']>((state) => state.gasprice)
}

export function estimateGasCosts(state: GasPrice, estimatedGasUsed?: number) {
  // const state2 = useGasPriceState()

  // Fetch 1/3 and 1/10 of the estimated fast rate
  const remove = BigNumber.from(state.fast).div(3)
  const addOn = BigNumber.from(state.fast).div(10)

  // Compute the lowest and largest estimate for the network fee.
  const lowestEstimate = BigNumber.from(state.fast).sub(remove) // Compute lowest estimate
  const largestEstimate = BigNumber.from(state.fast).add(addOn) // Computer highest estimate

  const lowestEstimateInGwei = Number(utils.formatUnits(lowestEstimate, 'gwei')).toFixed(0) // Format lowest
  const largestEstimateInGwei = Number(utils.formatUnits(largestEstimate, 'gwei')).toFixed(0)

  const gasUsed = estimatedGasUsed ? estimatedGasUsed : 180000

  // Compute estimated network fee based on 180k gas for the transaction
  const lowestFeeEstimate = lowestEstimate.mul(gasUsed)
  const lowestFeeEstimateEth = Number(utils.formatEther(lowestFeeEstimate)).toFixed(3)
  const largestFeeEstimate = largestEstimate.mul(gasUsed)
  const largestFeeEstimateEth = Number(utils.formatEther(largestFeeEstimate)).toFixed(3)

  return {
    lowestEstimate,
    largestEstimate,
    lowestEstimateInGwei,
    largestEstimateInGwei,
    lowestFeeEstimate,
    lowestFeeEstimateEth,
    largestFeeEstimate,
    largestFeeEstimateEth,
  }
}
