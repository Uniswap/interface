export function splitFormattedValue(
  value: string | undefined,
  decimalSeparator: string,
): { decimalPart: string; wholePart: string } {
  if (!value) {
    return { wholePart: '', decimalPart: '' }
  }
  const parts = value.split(decimalSeparator)
  return {
    wholePart: parts[0] ?? '',
    decimalPart: parts[1] ? decimalSeparator + parts[1] : '',
  }
}
