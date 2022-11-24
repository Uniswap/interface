import { Currency, Token } from '@kyberswap/ks-sdk-core'

/**
 * ex:  nguyen hoai danh => nguyen-hoai-danh
 * @param text
 * @returns
 */
export function convertToSlug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/ +/g, '-')
    .replace(/[^\w-.]+/g, '')
}

export const getSymbolSlug = (token: Currency | Token | undefined) =>
  token ? convertToSlug(token?.symbol || token?.wrapped?.symbol || '') : ''

export const isInEnum = <T extends Record<string, string>>(str: string, enumParam: T): str is T[keyof T] => {
  return Object.values(enumParam).includes(str)
}

// hello world => hello...
export const shortString = (str: string, n: number) => {
  if (!str) return ''
  return str.length <= n ? str : str.substring(0, n) + '...'
}
