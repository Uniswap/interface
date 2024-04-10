import ethereumLogo from 'assets/images/ethereum-logo.png'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'

export enum TokenStandard {
  ERC20,
  ERC721,
}

export interface InteractiveToken {
  name: string
  symbol: string
  address: string
  chain: Chain
  standard: TokenStandard
  color: string
  logoUrl: string
}

export const approvedERC20: InteractiveToken[] = [
  {
    name: 'Ethereum',
    symbol: 'ETH',
    address: NATIVE_CHAIN_ID,
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#627EEA',
    logoUrl: ethereumLogo,
  },
  {
    name: 'USDCoin',
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#2775CA',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#FFAA00',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  },
  {
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#F7931A',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  },
  {
    name: 'Euro Coin',
    symbol: 'EUROC',
    address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#60BFFE',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png',
  },
  {
    name: 'Pax Dollar',
    symbol: 'USDP',
    address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#075229',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x8E870D67F660D95d5be530380D0eC0bd388289E1/logo.png',
  },
  {
    name: 'Decentraland',
    symbol: 'MANA',
    address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
    color: '#FF144F',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x0F5D2fB29fb7d3CFeE444a200298f468908cC942/logo.png',
  },
  {
    name: 'Matic',
    symbol: 'MATIC',
    address: '0x0000000000000000000000000000000000001010',
    chain: Chain.Polygon,
    standard: TokenStandard.ERC20,
    color: '#833ADD',
    logoUrl: 'https://app.uniswap.org/static/media/matic-token-icon.efed2ee4e843195b44bf68ffc7439403.svg',
  },
  {
    name: 'Moss Carbon Credit',
    symbol: 'MCO2',
    address: '0xAa7DbD1598251f856C12f63557A4C4397c253Cea',
    chain: Chain.Polygon,
    standard: TokenStandard.ERC20,
    color: '#E1F345',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/polygon/assets/0xAa7DbD1598251f856C12f63557A4C4397c253Cea/logo.png',
  },
  {
    name: 'Optimism',
    symbol: 'OP',
    address: '0x4200000000000000000000000000000000000042',
    chain: Chain.Optimism,
    standard: TokenStandard.ERC20,
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
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Aave',
    symbol: 'AAVE',
    color: '#B6509E',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
    address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Chainlink',
    symbol: 'LINK',
    color: '#2A5ADA',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    standard: TokenStandard.ERC20,
    chain: Chain.Ethereum,
  },
  {
    name: 'Shiba Inu',
    symbol: 'SHIB',
    color: '#E01A2B',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
    address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    standard: TokenStandard.ERC20,
    chain: Chain.Ethereum,
  },
  {
    name: 'Pepe Token',
    symbol: 'PEPE',
    color: '#009E1E',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Apecoin',
    symbol: 'APE',
    color: '#1046D5',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x4d224452801ACEd8B2F0aebE155379bb5D594381/logo.png',
    address: '0x4d224452801aced8b2f0aebe155379bb5d594381',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Maker',
    symbol: 'MKR',
    color: '#6DAEA2',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png',
    address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Tether',
    symbol: 'USDT',
    color: '#409192',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Blur',
    symbol: 'BLUR',
    color: '#EA672B',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x5283D291DBCF85356A21bA090E6db59121208b44/logo.png',
    address: '0x5283D291DBCF85356A21bA090E6db59121208b44',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Compound',
    symbol: 'COMP',
    color: '#00D395',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png',
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Curve DAO Token',
    symbol: 'CRV',
    color: '#930201',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
    address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
  {
    name: 'Ethereum Name Service',
    symbol: 'ENS',
    color: '#66A0F5',
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72/logo.png',
    address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC20,
  },
]

export const approvedERC721: InteractiveToken[] = [
  {
    name: 'Unisocks',
    symbol: 'SOCKS',
    address: '0x65770b5283117639760beA3F867b69b3697a91dd',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#CD237A',
    logoUrl:
      'https://i.seadn.io/gae/70fhKktz1h38x5pHR-DGxL4zP820_kSe5iVR_dDFXEo-etqbU5H_S-qfnvot7bd2AO7VzsRlgiU1AHYVtLfKaJZx?auto=format&dpr=1&w=384',
  },
  {
    name: 'Shields',
    symbol: 'SHIELDS',
    address: '0x0747118C9F44C7a23365b2476dCD05E03114C747',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#FE007A',
    logoUrl:
      'https://i.seadn.io/gae/YPrTXYJJn4SiRupatfXX2dzDVbOsSh2yoRVXuFOCpRA70aOkvGlg2rzGRl_U5reKUIykOxJzbCNXlQnwg3MW5Agk5OnAzUFJVZ0J?auto=format&dpr=1&w=384',
  },
  {
    name: 'mfers',
    symbol: 'MFER',
    address: '0x79FCDEF22feeD20eDDacbB2587640e45491b757f',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#FEE162',
    logoUrl:
      'https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKsbP_7bNGd8cpKmWhFQmqMXOC8q2sOdqw?auto=format&dpr=1&w=512',
  },
  {
    name: 'tubby cats',
    symbol: 'TUBBY',
    address: '0xCa7cA7BcC765F77339bE2d648BA53ce9c8a262bD',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#FE7FBE',
    logoUrl:
      'https://i.seadn.io/gae/TyPJi06xkDXOWeK4wYBCIskRcSJpmtVfVcJbuxNXDVsC39IC_Ls5taMlxpZPYMoUtlPH7YkQ4my1nwUGDIB5C01r97TPlYhkolk-TA?auto=format&dpr=1&w=256',
  },
  {
    name: 'HyperLoot',
    symbol: 'HLOOT',
    address: '0x0290d49f53A8d186973B82faaFdaFe696B29AcBb',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#EFBE40',
    logoUrl:
      'https://i.seadn.io/gae/aVGIsSXcxaV-hsaez_Xud5yhUy-057ix-3wI1iT6xodntJnewyDQPerb_3Tz3pJea4S8MrbAcc6SixjTu_hOUKG2HnLkXD_eSzvb?auto=format&dpr=1&w=48',
  },
  {
    name: 'Nouns',
    symbol: 'NOUN',
    address: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#E8265B',
    logoUrl:
      'https://i.seadn.io/gae/vfYB4RarIqixy2-wyfP4lIdK6fsOT8uNrmKxvYCJdjdRwAMj2ZjC2zTSxL-YKky0s-4Pb6eML7ze3Ouj54HrpUlfSWx52xF_ZK2TYw?auto=format&dpr=1&w=750',
  },
  {
    name: 'Binkies',
    symbol: 'B',
    address: '0xa06FDA2CaA66148603314451BA0F30c9c5d539E3',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#FFA580',
    logoUrl:
      'https://i.seadn.io/gae/Nhn_GZkns5Mo8Ks33Q9u_ER3wbiVZcBWHWDWc84JWXCceqhZNenqbl3RT_61AmHxzx9yc57Ke4eRs_VJl-1LY4LU075HDQp8cB2IPw?auto=format&dpr=1&w=750',
  },
  {
    name: 'Chain Runners',
    symbol: 'RUN',
    address: '0x97597002980134beA46250Aa0510C9B90d87A587',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#00FE56',
    logoUrl:
      'https://i.seadn.io/gae/3vScLGUcTB7yhItRYXuAFcPGFNJ3kgO0mXeUSUfEMBjGkGPKz__smtXyUlRxzZjr1Y5x8hz1QXoBQSEb8wm4oBByeQC_8WOCaDON4Go?auto=format&dpr=1&w=750',
  },
  {
    name: 'OKPC',
    symbol: 'OKPC',
    address: '0x7183209867489E1047f3A7c23ea1Aed9c4E236E8',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#F6B53F',
    logoUrl:
      'https://i.seadn.io/gae/s8XNoLgpMIdjmOuOYy4qNjLrg59WPd9HRUp31uG3FLlSDzE68_HQfFYeAotCHBLYwB8ugByqi8hTEiH-gRWhu2DcvkD6bVDGSY1RhQ?auto=format&dpr=1&w=48',
  },
  {
    name: 'The Blitnauts',
    symbol: 'NAUT',
    address: '0x448f3219CF2A23b0527A7a0158e7264B87f635Db',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#967CDC',
    logoUrl:
      'https://i.seadn.io/gae/0tU9duZZsSeVxpcCJTGiPzqGF47ghOf0_b2rVcURBX-EjnQNY2xlBB3d1AX_XvtQC6MOMihEY8miYv-bH-i49F4IY_pks5KPeB19bw?auto=format&dpr=1&w=64',
  },
  {
    name: 'Froggy Friends',
    symbol: 'FROGGY',
    address: '0x7ad05c1b87e93BE306A9Eadf80eA60d7648F1B6F',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
    color: '#92CEA8',
    logoUrl: 'https://i.seadn.io/gcs/files/fedec03593a44488bc31f6365781069a.png?auto=format&dpr=1&w=512',
  },
  {
    name: 'Bibos',
    symbol: 'BIBO',
    color: '#6629C9',
    logoUrl:
      'https://assets.coingecko.com/nft_contracts/images/1290/large/8b3c65ff29a58dd59ae26503ad40ab72.png?1659692625',
    address: '0xf528e3381372c43f5e8a55b3e6c252e32f1a26e4',
    chain: Chain.Ethereum,
    standard: TokenStandard.ERC721,
  },
]
