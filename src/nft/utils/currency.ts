import { formatEther, parseEther } from '@ethersproject/units'

export const formatUsdPrice = (price: number) => {
  if (price > 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`
  } else if (price > 1000) {
    return `$${(price / 1000).toFixed(1)}K`
  } else {
    return `$${price.toFixed(2)}`
  }
}

export const formatEth = (price: number) => {
  if (price > 1000000) {
    return `${Math.round(price / 1000000)}M`
  } else if (price > 1000) {
    return `${Math.round(price / 1000)}K`
  } else {
    return `${Math.round(price * 100 + Number.EPSILON) / 100}`
  }
}

export const formatUSDPriceWithCommas = (price: number) => {
  return `$${Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export const formatEthPrice = (price: string | undefined) => {
  if (!price) return 0

  const formattedPrice = parseFloat(formatEther(String(price)))
  return (
    Math.round(formattedPrice * (formattedPrice >= 1 ? 100 : 1000) + Number.EPSILON) /
    (formattedPrice >= 1 ? 100 : 1000)
  )
}

// Stringify the `price` anyway because the `price` is being passed as any in some places
export const numberToWei = (amount: number) => {
  return parseEther(amount.toString())
}

export const ethNumberStandardFormatter = (
  amount: string | number | undefined,
  includeDollarSign = false,
  removeZeroes = false
): string => {
  if (!amount) return '-'

  const amountInDecimals = parseFloat(amount.toString())
  const conditionalDollarSign = includeDollarSign ? '$' : ''

  if (amountInDecimals < 0.0001) return `< ${conditionalDollarSign}0.00001`
  if (amountInDecimals < 1) return `${conditionalDollarSign}${amountInDecimals.toFixed(3)}`
  const formattedPrice = (removeZeroes ? parseFloat(amountInDecimals.toFixed(2)) : amountInDecimals.toFixed(2))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return conditionalDollarSign + formattedPrice
}

export const formatWeiToDecimal = (amount: string, removeZeroes = false) => {
  if (!amount) return '-'
  return ethNumberStandardFormatter(formatEther(amount), false, removeZeroes)
}
