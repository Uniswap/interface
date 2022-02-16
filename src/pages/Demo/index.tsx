import { SwapWidget } from '@uniswap/widgets'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

const infuraRPC = 'https://mainnet.infura.io/v3/1b8c5cd5b7354456a43cd6c5c0c8d970'

export default function Demo() {
  const { library } = useActiveWeb3React()

  return (
    <SwapWidget
      jsonRpcEndpoint={infuraRPC}
      provider={library?.provider}
      theme={DEMO_THEME}
      tokenList={CUSTOM_TOKEN_LIST}
    />
  )
}

const DEMO_THEME = {
  borderRadius: 0.6,
  tokenColorExtraction: false,
  fontFamilyVariable: 'Roboto Mono',
  container: '#E3E7D7',
  module: '#C9CAAD',
  accent: '#1C006C',
  primary: 'grey',
  secondary: 'black',
}

// You can also pass a token list as JSON, as long as it matches the schema
const CUSTOM_TOKEN_LIST = [
  {
    name: 'Friends With Benefits Pro',
    address: '0x35bd01fc9d6d5d81ca9e055db88dc49aa2c699a8',
    symbol: 'FWB',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://s2.coinmarketcap.com/static/img/coins/64x64/10090.png',
  },
]
