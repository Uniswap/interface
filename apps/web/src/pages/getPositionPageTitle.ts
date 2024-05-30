import { t } from 'i18n'

export const getPositionPageTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')

  return t(`Manage pool liquidity{{version}} on Uniswap`, {
    version: isV2 ? ' (v2)' : '',
  })
}

export const getPositionPageDescription = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')

  return t(`View your active {{version}} liquidity positions. Add new positions.`, {
    version: isV2 ? 'v2' : 'v3',
  })
}

export const getAddLiquidityPageTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')

  return t(`Add liquidity to pools{{version}} on Uniswap`, {
    version: isV2 ? ' (v2)' : '',
  })
}
