// To combine kyberswap & kyberswap-static into one option on UI
// They are both kyberswap classic, one is dynamic fee, other is static fee
export const KYBERSWAP_KS_DEXES_TO_UI_DEXES: { [key: string]: string | undefined } = {
  kyberswapv2: 'kyberswapv2',
  kyberswap: 'kyberswapv1',
  'kyberswap-static': 'kyberswapv1',
  'kyberswap-limit-order': 'kyberswap-limit-order',
}

export const KYBERSWAP_UI_DEXES: {
  [key: string]: {
    name: string
    id: string
    logoURL: string
  }
} = {
  kyberswapv2: {
    name: 'KyberSwap Elastic',
    id: 'kyberswapv2',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  kyberswapv1: {
    name: 'KyberSwap Classic',
    id: 'kyberswapv1',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
  'kyberswap-limit-order': {
    name: 'KyberSwap Limit Order',
    id: 'kyberswap-limit-order',
    logoURL: 'https://kyberswap.com/favicon.ico',
  },
}
