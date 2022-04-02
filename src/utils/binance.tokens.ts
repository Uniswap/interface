import { Token } from "@uniswap/sdk-core"
import { SupportedChainId } from "constants/chains"

const { BINANCE: MAINNET } = SupportedChainId

interface TokenList {
  [symbol: string]: Token
}

interface SerializedTokenList {
  [symbol: string]: any
}

export const binanceTokens = {
  wbnb: new Token(
    MAINNET,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB',
  ),
  // bnb here points to the wbnb contract. Wherever the currency BNB is required, conditional checks for the symbol 'BNB' can be used
  bnb: new Token(MAINNET, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 18, 'BNB', 'BNB'),
  cake: new Token(
    MAINNET,
    '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    18,
    'CAKE',
    'PancakeSwap Token',
  ),
  tlos: new Token(MAINNET, '0xb6C53431608E626AC81a9776ac3e999c5556717c', 18, 'TLOS', 'Telos'),
  beta: new Token(
    MAINNET,
    '0xBe1a001FE942f96Eea22bA08783140B9Dcc09D28',
    18,
    'BETA',
    'Beta Finance',
  ),
  nft: new Token(MAINNET, '0x1fC9004eC7E5722891f5f38baE7678efCB11d34D', 6, 'NFT', 'APENFT'),
  stephero: new Token(
    MAINNET,
    '0xE8176d414560cFE1Bf82Fd73B986823B89E4F545',
    18,
    'HERO',
    'StepHero',
  ),
  pros: new Token(MAINNET, '0xEd8c8Aa8299C10f067496BB66f8cC7Fb338A3405', 18, 'PROS', 'Prosper'),
  qbt: new Token(MAINNET, '0x17B7163cf1Dbd286E262ddc68b553D899B93f526', 18, 'QBT', 'Qubit Token'),
  cvp: new Token(
    MAINNET,
    '0x5Ec3AdBDae549Dce842e24480Eb2434769e22B2E',
    18,
    'CVP',
    'Concentrated Voting Power Token',
  ),
  bscdefi: new Token(
    MAINNET,
    '0x40E46dE174dfB776BB89E04dF1C47d8a66855EB3',
    18,
    'BSCDEFI',
    'BSC Defi blue chips token',
  ),
  busd: new Token(
    MAINNET,
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    18,
    'BUSD',
    'Binance USD',
  ),
  dai: new Token(
    MAINNET,
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  usdt: new Token(
    MAINNET,
    '0x55d398326f99059fF775485246999027B3197955',
    18,
    'USDT',
    'Tether USD',
  ),
  btcb: new Token(
    MAINNET,
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    18,
    'BTCB',
    'Binance BTC',
  ),
  ust: new Token(
    MAINNET,
    '0x23396cF899Ca06c4472205fC903bDB4de249D6fC',
    18,
    'UST',
    'Wrapped UST Token',
  ),
  eth: new Token(
    MAINNET,
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    18,
    'ETH',
    'Binance-Peg Ethereum Token',
  ),
  usdc: new Token(
    MAINNET,
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    18,
    'USDC',
    'Binance-Peg USD Coin',
  ),
  
}

