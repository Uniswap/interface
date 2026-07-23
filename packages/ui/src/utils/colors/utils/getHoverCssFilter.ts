export function getHoverCssFilter({
  isDarkMode = false,
  differenceFrom1 = 0.05,
}: {
  isDarkMode?: boolean
  differenceFrom1?: number
}): string {
  return isDarkMode ? `brightness(${1 + differenceFrom1})` : `brightness(${1 - differenceFrom1})`
}
