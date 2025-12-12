import { GraphQLApi } from '@universe/api'
import ethereumLogo from 'assets/images/ethereum-logo.png'
import { NATIVE_CHAIN_ID } from 'constants/tokens'

export interface InteractiveToken {
  name: string
  symbol: string
  address: string
  chain: GraphQLApi.Chain
  color: string
  logoUrl: string
}

export const approvedERC20: InteractiveToken[] = [
  {
    name: 'Ethereum',
    symbol: 'ETH',
    address: NATIVE_CHAIN_ID,
    chain: GraphQLApi.Chain.Ethereum,
    color: '#627EEA',
    logoUrl: ethereumLogo,
  },
  {
    name: 'USDCoin',
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chain: GraphQLApi.Chain.Ethereum,
    color: '#2775CA',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    chain: GraphQLApi.Chain.Ethereum,
    color: '#FFAA00',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  },
  {
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    chain: GraphQLApi.Chain.Ethereum,
    color: '#F7931A',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  },
  {
    name: 'Euro Coin',
    symbol: 'EUROC',
    address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    chain: GraphQLApi.Chain.Ethereum,
    color: '#60BFFE',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png',
  },
  {
    name: 'Pax Dollar',
    symbol: 'USDP',
    address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    chain: GraphQLApi.Chain.Ethereum,
    color: '#075229',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x8E870D67F660D95d5be530380D0eC0bd388289E1/logo.png',
  },
  {
    name: 'Decentraland',
    symbol: 'MANA',
    address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
    chain: GraphQLApi.Chain.Ethereum,
    color: '#FF144F',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x0F5D2fB29fb7d3CFeE444a200298f468908cC942/logo.png',
  },
  {
    name: 'Polygon',
    symbol: 'POL',
    address: '0x0000000000000000000000000000000000001010',
    chain: GraphQLApi.Chain.Polygon,
    color: '#833ADD',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/polygon/assets/0x0000000000000000000000000000000000001010/logo.png',
  },
  {
    name: 'Moss Carbon Credit',
    symbol: 'MCO2',
    address: '0xAa7DbD1598251f856C12f63557A4C4397c253Cea',
    chain: GraphQLApi.Chain.Polygon,
    color: '#E1F345',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/polygon/assets/0xAa7DbD1598251f856C12f63557A4C4397c253Cea/logo.png',
  },
  {
    name: 'Optimism',
    symbol: 'OP',
    address: '0x4200000000000000000000000000000000000042',
    chain: GraphQLApi.Chain.Optimism,
    color: '#FF001A',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/optimism/assets/0x4200000000000000000000000000000000000042/logo.png',
  },
  {
    name: 'Uniswap',
    symbol: 'UNI',
    color: '#FF007A',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Aave',
    symbol: 'AAVE',
    color: '#B6509E',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Chainlink',
    symbol: 'LINK',
    color: '#2A5ADA',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Shiba Inu',
    symbol: 'SHIB',
    color: '#E01A2B',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
    address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Pepe Token',
    symbol: 'PEPE',
    color: '#009E1E',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Apecoin',
    symbol: 'APE',
    color: '#1046D5',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png',
    address: '0x4d224452801aced8b2f0aebe155379bb5d594381',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Maker',
    symbol: 'MKR',
    color: '#6DAEA2',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png',
    address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Tether',
    symbol: 'USDT',
    color: '#409192',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Blur',
    symbol: 'BLUR',
    color: '#EA672B',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x5283D291DBCF85356A21bA090E6db59121208b44/logo.png',
    address: '0x5283D291DBCF85356A21bA090E6db59121208b44',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Compound',
    symbol: 'COMP',
    color: '#00D395',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png',
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Curve DAO Token',
    symbol: 'CRV',
    color: '#930201',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
    address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    chain: GraphQLApi.Chain.Ethereum,
  },
  {
    name: 'Ethereum Name Service',
    symbol: 'ENS',
    color: '#66A0F5',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72/logo.png',
    address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
    chain: GraphQLApi.Chain.Ethereum,
  },
]
