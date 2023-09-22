import { formatEther } from '@ethersproject/units'

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
  } else if (price < 0.001) {
    return '<0.001'
  } else {
    return `${Math.round(price * 1000 + Number.EPSILON) / 1000}`
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

export const ethNumberStandardFormatter = (
  amount: string | number | undefined,
  includeDollarSign = false,
  removeZeroes = false,
  roundToNearestWholeNumber = false
): string => {
  if (!amount) return '-'

  const amountInDecimals = parseFloat(amount.toString())
  const conditionalDollarSign = includeDollarSign ? '$' : ''

  if (amountInDecimals <= 0) return '-'
  if (amountInDecimals < 0.0001) return `< ${conditionalDollarSign}0.00001`
  if (amountInDecimals < 1) return `${conditionalDollarSign}${parseFloat(amountInDecimals.toFixed(3))}`
  const formattedPrice = (
    removeZeroes
      ? parseFloat(amountInDecimals.toFixed(2))
      : roundToNearestWholeNumber
      ? Math.round(amountInDecimals)
      : amountInDecimals.toFixed(2)
  )
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return conditionalDollarSign + formattedPrice
}

export const formatWeiToDecimal = (amount: string, removeZeroes = false) => {
  if (!amount) return '-'
  return ethNumberStandardFormatter(formatEther(amount), false, removeZeroes, false)
}

// prevent BigNumber overflow by properly handling scientific notation and comma delimited values
export function wrapScientificNotation(value: string | number): string {
  return parseFloat(value.toString())
    .toLocaleString('fullwide', { useGrouping: false })
    .replace(',', '.')
    .replace(' ', '')
}
