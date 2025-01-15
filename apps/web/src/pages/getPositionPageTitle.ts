import i18n from 'uniswap/src/i18n'

export const getPositionPageTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')
  const isV3 = parts?.find((part) => part === 'v3')

  return i18n.t(`liquidityPool.positions.page.version.title`, {
    version: isV2 ? ' (v2)' : isV3 ? ' (v3)' : '',
  })
}

export const getPositionPageDescription = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')
  const isV3 = parts?.find((part) => part === 'v3')

  return i18n.t(`liquidityPool.positions.page.version.description`, {
    version: isV2 ? 'v2' : isV3 ? 'v3' : 'v4',
  })
}

export const getAddLiquidityPageTitle = (path?: string) => {
  const parts = path?.split('/').filter((part) => part !== '')
  const isV2 = parts?.find((part) => part === 'v2')
  const isV3 = parts?.find((part) => part === 'v3')

  return i18n.t('liquidityPool.page.title', {
    version: isV2 ? ' (v2)' : isV3 ? ' (v3)' : '',
  })
}
