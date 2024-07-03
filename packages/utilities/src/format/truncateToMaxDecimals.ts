export function truncateToMaxDecimals({
  value,
  maxDecimals,
  decimalSeparator = '.',
}: {
  value: string
  maxDecimals: number
  decimalSeparator?: '.' | ','
}): string {
  const [beforeDecimalSeparator, afterDecimalSeparator] = value.split(decimalSeparator)

  if (afterDecimalSeparator === undefined) {
    return value
  }

  return `${beforeDecimalSeparator}.${afterDecimalSeparator.substring(0, maxDecimals)}`
}

export function maxDecimalsReached({
  value,
  maxDecimals,
  decimalSeparator = '.',
}: {
  value: string
  maxDecimals: number
  decimalSeparator?: '.' | ','
}): boolean {
  const numberOfDecimals = value.split(decimalSeparator)[1]?.length ?? 0
  return numberOfDecimals >= maxDecimals
}
