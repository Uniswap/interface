export const MATIC_TOKEN_LIST = {
  name: 'DmmExchange Token List',
  keywords: ['dmmexchange'],
  timestamp: '2020-12-12T00:00:00+00:00',
  tokens: [
    {
      chainId: 137,
      address:
        process.env.REACT_APP_MAINNET_ENV === 'staging'
          ? '0x51E8D106C646cA58Caf32A47812e95887C071a62'
          : '0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C',
      symbol: 'KNC',
      name: 'Kyber Network Crystal',
      decimals: 18
    },
    {
      chainId: 137,
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18
    },
    {
      chainId: 137,
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USDC',
      decimals: 6
    },
    {
      chainId: 137,
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'USDT',
      decimals: 6
    },
    {
      chainId: 137,
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      symbol: 'DAI',
      name: 'DAI',
      decimals: 18
    },
    {
      chainId: 137,
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18
    },
    {
      chainId: 137,
      address: '0x3A3e7650f8B9f667dA98F236010fBf44Ee4B2975',
      symbol: 'XUSD',
      name: 'xDollar Stablecoin',
      decimals: 18
    },
    {
      chainId: 137,
      address: '0x3Dc7B06dD0B1f08ef9AcBbD2564f8605b4868EEA',
      symbol: 'XDO',
      name: 'xDollar',
      decimals: 18
    },
    {
      chainId: 137,
      address: '0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c',
      symbol: 'jEUR',
      name: 'Jarvis Synthetic Euro',
      decimals: 18,
      logoURI: 'https://i.imgur.com/92uhfao.png'
    },
    {
      chainId: 137,
      address: '0x767058F11800FBA6A682E73A6e79ec5eB74Fac8c',
      symbol: 'jGBP',
      name: 'Jarvis Synthetic British Pound',
      decimals: 18,
      logoURI: 'https://i.imgur.com/HS7BMfs.png'
    },
    {
      chainId: 137,
      address: '0xbD1463F02f61676d53fd183C2B19282BFF93D099',
      symbol: 'jCHF',
      name: 'Jarvis Synthetic Swiss Franc',
      decimals: 18,
      logoURI: 'https://i.imgur.com/Fp31dDB.png'
    },
    {
      chainId: 137,
      address: '0x00e5646f60AC6Fb446f621d146B6E1886f002905',
      symbol: 'RAI',
      name: 'Rai Reflex Index',
      decimals: 18,
      logoURI: 'https://assets.coingecko.com/coins/images/14004/small/RAI-logo-coin.png?1613592334'
    },
    {
      chainId: 137,
      address: '0xfAdE2934b8E7685070149034384fB7863860D86e',
      symbol: 'AUR-0112',
      name: 'Aureus',
      decimals: 18,
      logoURI: 'https://i.imgur.com/PyipL43.png'
    },
    {
      chainId: 137,
      address: '0xc1c93D475dc82Fe72DBC7074d55f5a734F8cEEAE',
      symbol: 'PGX',
      name: 'Pegaxy Stone',
      decimals: 18
    }
  ],
  version: {
    major: 0,
    minor: 0,
    patch: 0
  }
}
