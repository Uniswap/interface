import { getTokenLogoURL } from 'utils'

export const ROPSTEN_TOKEN_LIST = {
  name: 'DmmExchange Token List',
  keywords: ['dmmexchange'],
  timestamp: '2020-12-12T00:00:00+00:00',
  tokens: [
    {
      chainId: 3,
      address: '0xbe87E5634f9FC7cD3ED88ad58b1462F3C5A7EB5b',
      symbol: 'KNC',
      name: 'Kyber Network Crystal',
      decimals: 18,
      logoURI: getTokenLogoURL('0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202')
    },
    {
      chainId: 3,
      address: '0x7b2810576aa1cce68f2b118cef1f36467c648f92',
      symbol: 'KNCL',
      name: 'Kyber Network Crystal Legacy',
      decimals: 18,
      logoURI: 'https://i.imgur.com/1cDH5dy.png'
    },
    {
      chainId: 3,
      address: '0x068B43f7F2f2c6a662C36E201144aE45f7a1C040',
      symbol: 'USDC',
      name: 'USDC',
      decimals: 6,
      logoURI: getTokenLogoURL('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
    },
    {
      chainId: 3,
      address: '0x65Bd1F48f1dd07bb285a3715c588F75684128acE',
      symbol: 'USDT',
      name: 'USDT',
      decimals: 6,
      logoURI: getTokenLogoURL('0xdAC17F958D2ee523a2206206994597C13D831ec7')
    },
    {
      chainId: 3,
      address: '0xad6d458402f60fd3bd25163575031acdce07538d',
      symbol: 'DAI',
      name: 'DAI',
      decimals: 18,
      logoURI: getTokenLogoURL('0x6B175474E89094C44Da98b954EedeAC495271d0F')
    },
    {
      chainId: 3,
      address: '0x3dff0dce5fc4b367ec91d31de3837cf3840c8284',
      symbol: 'WBTC',
      name: 'WBTC',
      decimals: 8,
      logoURI: getTokenLogoURL('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599')
    },
    {
      chainId: 3,
      address: '0xa748593dD74E5d0BB38a3f2F5090a0f31370c574',
      symbol: 'renBTC',
      name: 'renBTC',
      decimals: 8,
      logoURI: getTokenLogoURL('0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D')
    },
    {
      chainId: 3,
      address: '0xb4f7332ed719eb4839f091eddb2a3ba309739521',
      symbol: 'LINK',
      name: 'LINK',
      decimals: 18,
      logoURI: getTokenLogoURL('0x514910771AF9Ca656af840dff83E8264EcF986CA')
    },
    {
      chainId: 3,
      address: '0xdb0040451f373949a4be60dcd7b6b8d6e42658b6',
      symbol: 'BAT',
      name: 'BAT',
      decimals: 18,
      logoURI: getTokenLogoURL('0x0D8775F648430679A709E98d2b0Cb6250d2887EF')
    },
    {
      chainId: 3,
      address: '0x787e7339a52d7784a22146da7209c702e1e38511',
      symbol: 'COMP',
      name: 'COMP',
      decimals: 18,
      logoURI: getTokenLogoURL('0xc00e94Cb662C3520282E6f5717214004A7f26888')
    },
    {
      chainId: 3,
      address: '0x5f4F41E067e8cCF0d1F9EE007223aF4D72990cdC',
      symbol: 'AAVE',
      name: 'AAVE',
      decimals: 18,
      logoURI: getTokenLogoURL('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9')
    },
    {
      chainId: 80001,
      address: '0x5973774202E8b0ad563A69D502bb0e670e7d00Dd',
      symbol: 'MATICTESTTOKEN',
      name: 'MATICTESTTOKEN',
      decimals: 18,
      logoURI: getTokenLogoURL('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9')
    }
  ],
  version: {
    major: 0,
    minor: 0,
    patch: 0
  }
}
