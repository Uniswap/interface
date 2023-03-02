import { ChainId } from '@kyberswap/ks-sdk-core'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PublicKey } from '@solana/web3.js'

import Solana from 'assets/networks/solana-network.svg'
import { KS_SETTING_API } from 'constants/env'
import { SolanaNetworkInfo } from 'constants/networks/type'

export const SelectedNetwork = WalletAdapterNetwork.Mainnet

const NOT_SUPPORT = null
const solanaInfo: SolanaNetworkInfo = {
  chainId: ChainId.SOLANA,
  route: 'solana',
  ksSettingRoute: 'solana',
  priceRoute: 'solana',
  aggregatorRoute: 'solana',
  name: 'Solana',
  icon: Solana,
  iconSelected: Solana,
  iconDark: NOT_SUPPORT,
  iconDarkSelected: NOT_SUPPORT,
  etherscanUrl: 'https://solscan.io',
  etherscanName: 'Solana scan',
  bridgeURL: 'https://www.portalbridge.com/#/transfer',
  nativeToken: {
    symbol: 'SOL',
    name: 'SOL',
    logo: Solana,
    decimal: 9,
    // Fee for Solana: 5000 lamport * signature = 5000 * 10^-9 SOL * signature
    // Rent fee for set up account: 0.00203928 SOL
    // We might need setup up to 3 accounts or even more for openbook
    // => use 0.01
    // above values might change
    minForGas: 10 ** 7,
  },
  aggregatorProgramAddress: 'GmgkeeJtcjHgeiSDdT5gxznUDr5ygq9jo8tmA4ny7ziv',
  // classic: {
  //   factory: 'CwzigBwGVn25LdyLsqzSX3iwhPwQXoxYcXxSM4sjWoBU',
  //   pool: 'EKdy97aMrjjxtq4CJh9vN24WuHVsuLz4qtDjyYqttviN',
  //   router: '6VdLuZvVxdgFYQiCQ1VDBBdE27RahXzv2wCxwG4FAzAn',
  // },
  limitOrder: { development: NOT_SUPPORT, production: NOT_SUPPORT },
  coingeckoNetworkId: 'solana',
  coingeckoNativeTokenId: 'solana',
  tokenListUrl: `${KS_SETTING_API}/v1/tokens?chainIds=${ChainId.SOLANA}&isWhitelisted=${true}`,
  defaultRpcUrl: 'https://solana.kyberengineering.io',
  trueSightId: NOT_SUPPORT,
  openBookAddress: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
  dexToCompare: 'OrcaV2',
}

export default solanaInfo
