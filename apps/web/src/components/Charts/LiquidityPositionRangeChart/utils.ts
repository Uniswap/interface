import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { FlexProps } from 'ui/src/components/layout/Flex'

export function getCrosshairProps(
  color: any,
  { yCoordinate, xCoordinate }: { yCoordinate: number; xCoordinate: number },
): FlexProps {
  return {
    position: 'absolute',
    left: xCoordinate - 3,
    top: yCoordinate - 3, // Center the crosshair vertically on the price line.
    width: 6,
    height: 6,
    borderRadius: '$roundedFull',
    backgroundColor: color,
  }
}

export function isEffectivelyInfinity(value: number): boolean {
  return Math.abs(value) >= 1e20 || Math.abs(value) <= 1e-20
}

export function priceToNumber(price: Maybe<Price<Currency, Currency>>, defaultValue: number): number {
  const baseCurrency = price?.baseCurrency
  if (!baseCurrency) {
    return defaultValue
  }

  const sigFigs = Boolean(baseCurrency.decimals) && baseCurrency.decimals > 0 ? baseCurrency.decimals : 6

  const numPrice = Number(
    price.quote(CurrencyAmount.fromRawAmount(baseCurrency, Math.pow(10, baseCurrency.decimals))).toSignificant(sigFigs),
  )

  if (isEffectivelyInfinity(numPrice)) {
    return defaultValue
  }

  return numPrice
}
