export function replaceSeparators({
  value,
  groupingSeparator,
  decimalSeparator,
  groupingOverride,
  decimalOverride,
}: {
  value: string
  groupingSeparator?: string
  decimalSeparator: string
  groupingOverride?: string
  decimalOverride: string
}): string {
  let outputParts = value.split(decimalSeparator)
  if (groupingSeparator && groupingOverride != null) {
    outputParts = outputParts.map((part) =>
      // eslint-disable-next-line security/detect-non-literal-regexp
      part.replace(new RegExp(`\\${groupingSeparator}`, 'g'), groupingOverride),
    )
  }
  return outputParts.join(decimalOverride)
}
