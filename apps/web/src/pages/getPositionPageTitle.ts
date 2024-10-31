import { t } from 'uniswap/src/i18n'

export const getPositionPageTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')

  return t(`liquidityPool.positions.page.version.title`, {
    version: isV2 ? ' (v2)' : '',
  })
}

export const getPositionPageDescription = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')

  return t(`liquidityPool.positions.page.version.description`, {
    version: isV2 ? 'v2' : 'v3',
  })
}

export const getAddLiquidityPageTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')

  return t('liquidityPool.page.title', {
    version: isV2 ? ' (v2)' : '',
  })
}
