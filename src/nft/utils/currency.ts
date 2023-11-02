// prevent BigNumber overflow by properly handling scientific notation and comma delimited values
export function wrapScientificNotation(value: string | number): string {
  return parseFloat(value.toString())
    .toLocaleString('fullwide', { useGrouping: false })
    .replace(',', '.')
    .replace(' ', '')
}
