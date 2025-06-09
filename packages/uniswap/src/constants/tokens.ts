/* eslint-disable max-lines */
import { Currency, NativeCurrency, Token, WETH9 } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UNIVERSE_CHAIN_INFO } from '../features/chains/chainInfo'

export const FLEX_USD = new Token(
  UniverseChainId.SmartBCH,
  '0x7b2B3C5308ab5b2a1d9a94d20D35CCDf61e05b72',
  18,
  'flexUSD',
  'flexUSD',
)

export const KI = new Token(UniverseChainId.SmartBCH, '0x4524cE998c2551CdA6d5763E0AD74153059B6207', 18, 'Ki', 'Ki')

export const ORB = new Token(UniverseChainId.SmartBCH, '0xFf3ed63bf8bC9303eA0A7E1215bA2f82D569799e', 18, 'ORB', 'ORB')

export const SPICE = new Token(
  UniverseChainId.SmartBCH,
  '0xE11829A7D5d8806BB36E118461a1012588faFD89',
  18,
  'SPICE',
  'SPICE',
)

export const KNUTH = new Token(
  UniverseChainId.SmartBCH,
  '0xc70c7718C7f1CCd906534C2c4a76914173EC2c44',
  18,
  'KTH',
  'Knuth',
)

export const GREEN_BEN = new Token(
  UniverseChainId.SmartBCH,
  '0x77CB87b57F54667978Eb1B199b28a0db8C8E1c0B',
  18,
  'EBEN',
  'Green Ben',
)

export const CASH_CATS = new Token(
  UniverseChainId.SmartBCH,
  '0x265bD28d79400D55a1665707Fa14A72978FA6043',
  2,
  '$CATS',
  'CashCats',
)

export const HONK = new Token(UniverseChainId.SmartBCH, '0xF2d4D9c65C2d1080ac9e1895F6a32045741831Cd', 2, 'HONK', 'HONK')

export const FLEX_COIN = new Token(
  UniverseChainId.SmartBCH,
  '0x98Dd7eC28FB43b3C4c770AE532417015fa939Dd3',
  18,
  'FLEX',
  'FLEX Coin',
)

export const TANGO = new Token(
  UniverseChainId.SmartBCH,
  '0x73BE9c8Edf5e951c9a0762EA2b1DE8c8F38B5e91',
  18,
  'TANGO',
  'TANGO',
)

export const X_TANGO = new Token(
  UniverseChainId.SmartBCH,
  '0x98Ff640323C059d8C4CB846976973FEEB0E068aA',
  18,
  'XTANGO',
  'xTANGO',
)

export const MIST = new Token(
  UniverseChainId.SmartBCH,
  '0x5fA664f69c2A4A3ec94FaC3cBf7049BD9CA73129',
  18,
  'MIST',
  'MIST',
)

export const X_MIST = new Token(
  UniverseChainId.SmartBCH,
  '0xC41C680c60309d4646379eD62020c534eB67b6f4',
  18,
  'XMIST',
  'xMIST',
)

export const POTATO_COIN = new Token(
  UniverseChainId.SmartBCH,
  '0xB5b1939ef0a3743d0Ae9282DbA62312b614A5Ac0',
  18,
  'POTA',
  'Potato Coin',
)

export const LAW = new Token(UniverseChainId.SmartBCH, '0x0b00366fBF7037E9d75E4A569ab27dAB84759302', 18, 'LAW', 'LAW')

export const LAW_USD = new Token(
  UniverseChainId.SmartBCH,
  '0xE1E655BE6F50344e6dd708c27BD8D66492d6ecAf',
  18,
  'lawUSD',
  'LAW US Dollar',
)

export const KONRA = new Token(
  UniverseChainId.SmartBCH,
  '0x4F1480ba79F7477230ec3b2eCc868E8221925072',
  18,
  'KONRA',
  'KONRA',
)

export const ALPHA = new Token(
  UniverseChainId.SmartBCH,
  '0x5a3bB59F34D60E9EB5643Fb80C8D712275F6a96A',
  18,
  'PHA',
  'Alpha',
)

export const HODL = new Token(
  UniverseChainId.SmartBCH,
  '0xB24D7763516bca9656779d760be9a32490f46E27',
  18,
  'HODL',
  'HODL',
)

export const ZOMBIE = new Token(
  UniverseChainId.SmartBCH,
  '0x80453ACDfE0073D6743B27D72e06F48777EeAd80',
  0,
  'ZOMBIE',
  'Zombie',
)

export const SMART_BUSD = new Token(
  UniverseChainId.SmartBCH,
  '0x9288df32951386A8254aEaF80a66B78cCaf75b82',
  2,
  'sBUSD',
  'Smart BUSD',
)

export const CASH_KITTEN = new Token(
  UniverseChainId.SmartBCH,
  '0x7eBeAdb95724a006aFaF2F1f051B13F4eBEBf711',
  2,
  '$KITTEN',
  'CashKitten',
)

export const SHIBA_CASH = new Token(
  UniverseChainId.SmartBCH,
  '0x2f309b9D47b1Ce7f0ec30a26baB2dEaB8c4ea5E9',
  18,
  'Shiba',
  'ShibaCash',
)

export const AXIE_BCH = new Token(
  UniverseChainId.SmartBCH,
  '0x3d13DaFcCA3a188DB340c81414239Bc2be312Ec9',
  18,
  'AXIEBCH',
  'AxieBCH',
)

export const BITCOIN_CASH_ARGENTINA = new Token(
  UniverseChainId.SmartBCH,
  '0x675E1d6FcE8C7cC091aED06A68D079489450338a',
  18,
  'ARG',
  'Bitcoin Cash Argentina',
)

export const MAZE = new Token(UniverseChainId.SmartBCH, '0x481De06DCA0198844faA36FCa04Db364e5c2f86C', 6, 'MAZE', 'MAZE')

export const UATX_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xFfA2394B61D3dE16538a2Bbf3491297Cc5a7C79a',
  18,
  'UAT',
  'UatX Token',
)

export const HAM_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0x252fd94f3Fb53D3D62F4FEc708501ACd59A57e52',
  8,
  'HAM',
  'Ham Token',
)

export const MILK = new Token(
  UniverseChainId.SmartBCH,
  '0xc8E09AEdB3c949a875e1FD571dC4b3E48FB221f0',
  18,
  'MILK',
  'MILK',
)

export const CHEESE = new Token(
  UniverseChainId.SmartBCH,
  '0x09A4CDb1569563fF277aC457cED35fe2551aEC1D',
  18,
  'CHEESE',
  'Cheese',
)

export const BCH_PAD = new Token(
  UniverseChainId.SmartBCH,
  '0x9192940099fDB2338B928DE2cad9Cd1525fEa881',
  18,
  'BPAD',
  'BCHPad',
)

export const NOMAD_COIN = new Token(
  UniverseChainId.SmartBCH,
  '0xEE1bA4e4C266C7cc071f5de5e6dc90965E608087',
  18,
  'NOMAD',
  'NomadCoin',
)

export const JOYSTICK = new Token(
  UniverseChainId.SmartBCH,
  '0x6732E55Ac3ECa734F54C26Bd8DF4eED52Fb79a6E',
  18,
  'JOYSTICK',
  'Joystick',
)

export const XOLOS = new Token(
  UniverseChainId.SmartBCH,
  '0x49F9ECF126B6dDF51C731614755508A4674bA7eD',
  18,
  'RMZ',
  'Xolos',
)

export const CELERY = new Token(
  UniverseChainId.SmartBCH,
  '0x7642Df81b5BEAeEb331cc5A104bd13Ba68c34B91',
  18,
  'CLY',
  'Celery',
)

export const DOGE_BCH = new Token(
  UniverseChainId.SmartBCH,
  '0x741746C2Cf4117730d7f087e8492dF595b4fd283',
  18,
  'DOGE',
  'DOGEBCH',
)

export const SMARTBCH_TOKEN_OBSERVER = new Token(
  UniverseChainId.SmartBCH,
  '0xAFACB0004A91267b58e720E13DF570Dc6863c854',
  18,
  'STO',
  'SmartBCH Token Observer',
)

export const SMART_INDEX = new Token(
  UniverseChainId.SmartBCH,
  '0xF05bD3d7709980f60CD5206BddFFA8553176dd29',
  18,
  'SIDX',
  'SmartIndex',
)

export const POINTS = new Token(
  UniverseChainId.SmartBCH,
  '0x71df12B5A718e0110991BB641cb379077d9e8Ef7',
  18,
  'PTS',
  'Points',
)

export const INCINERATE = new Token(
  UniverseChainId.SmartBCH,
  '0x225FCa2A940cd5B18DFb168cD9B7f921C63d7B6E',
  18,
  'FIRE',
  'Incinerate',
)

export const FATCAT = new Token(
  UniverseChainId.SmartBCH,
  '0xF4b10fcC5C22C9E6746a8f4DAc07A59e79ef947A',
  18,
  '$FATCAT',
  'FATCAT',
)

export const DECENTRALIZED_AUTONOMOUS_ORGANIZATION = new Token(
  UniverseChainId.SmartBCH,
  '0xca0235058985fcC1839E9e37c10900a73C126708',
  7,
  'DAO',
  'Decentralized Autonomous Organization',
)

export const BISMUTH_WIN_BI = new Token(
  UniverseChainId.SmartBCH,
  '0x2E1da8Eb00CD1FF9B201f51e3705D87e06313881',
  8,
  'BWB',
  'Bismuth Win Bi',
)

export const RBCH_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xb4602588E5F1F9653B6F234206c91552E457fAcB',
  18,
  'rBCH',
  'rBCH Token',
)

export const ONE_BCH_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0x77d4b6e44a53bBdA9a1D156B32Bb53A2D099e53D',
  18,
  '1BCH',
  '1BCH Token',
)

export const VIEGAGE_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xd8DE06b017857A821BA873D4F174B9580454f6c4',
  18,
  'VTO',
  'Viegage Token',
)

export const VOLCANO = new Token(
  UniverseChainId.SmartBCH,
  '0xc07545D17e716CF7FF24ed0eb16A69157A33aaCd',
  9,
  'BURN',
  'Volcano',
)

export const WENLAMBO = new Token(
  UniverseChainId.SmartBCH,
  '0x0E36C351ff40183435C9Bd1D17bfb1F3548f1963',
  18,
  'LAMBO',
  'Wenlambo',
)

export const GAME = new Token(
  UniverseChainId.SmartBCH,
  '0xd2597a0bde31Ddec2440E256d8AA35eb63F1A9e3',
  18,
  'GAME',
  'Game',
)

export const CENTRALIZED_AUTOCRATIC_ORGANIZATION = new Token(
  UniverseChainId.SmartBCH,
  '0x8358758D3952A0146560F3584d3b219ed631E1ea',
  9,
  'CAO',
  'Centralized Autocratic Organization',
)

export const WOJAK = new Token(
  UniverseChainId.SmartBCH,
  '0x8d7Ea0ec6CaB515463121A3c70Df541f2F534909',
  9,
  'WOJAK',
  'WOJAK',
)

export const MOON_MOON_MOON_MOON = new Token(
  UniverseChainId.SmartBCH,
  '0x2b591190FF951F60CB9424664155e57A402c1AdE',
  3,
  'MoonMoonMoonMoon',
  'MoonMoonMoonMoon',
)

export const GO_CRYPTO = new Token(
  UniverseChainId.SmartBCH,
  '0x4B85a666deC7C959e88b97814E46113601B07e57',
  18,
  'GoC',
  'GoCrypto',
)

export const KID_LAMBO = new Token(
  UniverseChainId.SmartBCH,
  '0x35e1103C3A630805666AC124f3eA2F1b3d69C4Db',
  9,
  'KidLambo',
  'KidLambo',
)

export const CRYPTO_SORTED = new Token(
  UniverseChainId.SmartBCH,
  '0x5B75B5eb28bEceDBB0A5A3cfeE6cdb4327E1856B',
  18,
  'CST',
  'CryptoSorted',
)

export const METADOR = new Token(
  UniverseChainId.SmartBCH,
  '0x7e56D225f69A5b0D1C2FC47673A5c41328fC82e0',
  18,
  'META',
  'METADOR',
)

export const CATS_LUCK = new Token(
  UniverseChainId.SmartBCH,
  '0x659F04F36e90143fCaC202D4BC36C699C078fC98',
  18,
  'CLK',
  'Catsluck',
)

export const BCH_DAO = new Token(
  UniverseChainId.SmartBCH,
  '0xe5643aAF41ed9e5a56C3D5D1a049b43Ac69950b2',
  18,
  'BCHDAO',
  'BCHDAO',
)

export const SMART_DOGE = new Token(
  UniverseChainId.SmartBCH,
  '0x6e6D4ECE35EEd638A1153339F69E543B7ae5F776',
  9,
  'SMART',
  'SmartDoge',
)

export const SPACE = new Token(
  UniverseChainId.SmartBCH,
  '0xB0c59E4B2249123b014c1C39D012BFCA58a8E1b7',
  8,
  'SPACE',
  'SPACE',
)

export const ZAPIT = new Token(
  UniverseChainId.SmartBCH,
  '0x23203d435e857EA63dEA5d43Fc098D29e3535FC5',
  18,
  'ZAPT',
  'Zapit',
)

export const EXPECTED_VALUE_ENTROPY = new Token(
  UniverseChainId.SmartBCH,
  '0x7b82A3b1417Cd21E67f745917a80cC0f53277B8C',
  7,
  'EVE',
  'Expected Value Entropy',
)

export const MR_BURGER = new Token(
  UniverseChainId.SmartBCH,
  '0x3b518F649f71d65E7160C1AaD640B6C17346145E',
  6,
  'MrBurger',
  'MrBurger',
)

export const DOG_LUCK = new Token(
  UniverseChainId.SmartBCH,
  '0xA019F70Ed3C02E861249B9e942bf4b88BCB408Df',
  18,
  'DLK',
  'DogLuck',
)

export const GOBLIN = new Token(
  UniverseChainId.SmartBCH,
  '0x56381cB87C8990971f3e9d948939e1a95eA113a3',
  9,
  'GOB',
  'Goblin',
)

export const FRIEND = new Token(
  UniverseChainId.SmartBCH,
  '0x4592B88618119e55e37FFCb28EDE02beF6F3c5bA',
  18,
  'FRN',
  'Friend',
)

export const KAIJU = new Token(
  UniverseChainId.SmartBCH,
  '0x4f909dFE5Daaf94fbd1fD4C2E582F7608C87cd94',
  18,
  'KAIJU',
  'KAIJU',
)

export const PUMP_PARROTS = new Token(
  UniverseChainId.SmartBCH,
  '0x20539E145b86A388683CB067dE576303aEC6DdE3',
  8,
  'PUMP',
  'PumpParrots',
)

export const DONER = new Token(
  UniverseChainId.SmartBCH,
  '0x14d9337F86d51DcAd0D28F6439e00039e251b592',
  18,
  'DONER',
  'Doner',
)

export const AKITA_INU = new Token(
  UniverseChainId.SmartBCH,
  '0x654adBEC36Ae3b61255368AF2fbAF6302A18fCB5',
  18,
  'AKITA',
  'Akita Inu',
)

export const MGOT = new Token(UniverseChainId.SmartBCH, '0x7DF65F158126898725f262378538B60db543C11A', 2, 'MGOT', 'MGOT')

export const JOOST_ENERGY = new Token(
  UniverseChainId.SmartBCH,
  '0x387122d80A642581E5AD620696a37b98BB9272e7',
  18,
  'JOOST',
  'Joost.energy',
)

export const BITCOIN_CASH_NAME_SERVICE = new Token(
  UniverseChainId.SmartBCH,
  '0x35b3Ee79E1A7775cE0c11Bd8cd416630E07B0d6f',
  18,
  'LNS',
  'Bitcoin Cash Name Service',
)

export const LNS_BAR = new Token(
  UniverseChainId.SmartBCH,
  '0xBE7E034c86AC2a302f69ef3975e3D14820cC7660',
  18,
  'xLNS',
  'LNSBar',
)

export const WYVERN_EGG = new Token(
  UniverseChainId.SmartBCH,
  '0x7cCb2b0012cB821b908D3db353db922a1a71E963',
  18,
  'WVE',
  'WyvernEgg',
)

export const NFT_CLUB_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0x8dd87b3f50bE9C6Ac5EC08458803843F0D294B3d',
  18,
  'NFTC',
  'NFT Club Token',
)

export const PANDA_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0x288B6Ca2eFCF39C9B68052B0088A0cB3f3D3B5f2',
  18,
  'PDA',
  'PandaToken',
)

export const NARATH = new Token(
  UniverseChainId.SmartBCH,
  '0x0cB20466c0Dd6454ACF50eC26F3042CCC6362fa0',
  18,
  'NARATH',
  'Narath',
)

export const GOBLINS_BCH = new Token(
  UniverseChainId.SmartBCH,
  '0x009dC89aC501a62C4FaaF7196aeE90CF79B6fC7c',
  18,
  'gBCH',
  'Goblins BCH',
)

export const AFRICA_UNITE = new Token(
  UniverseChainId.SmartBCH,
  '0x4EA4A00E15B9E8FeE27eB6156a865525083e9F71',
  18,
  'MartinB',
  'Africa Unite',
)

export const LAD = new Token(UniverseChainId.SmartBCH, '0xB34cBd2821B4e2F2E1223D08A11258076746F886', 18, 'LAD$', 'LAD')

export const BANANA_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xF80c1Ae9B21BC234c555c9c5F58E8C81996f8BB5',
  18,
  'BANANA',
  'Banana Token',
)

export const BLOCKNG_PEG_BNB_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xBc7b858B5694D485AD17c89675649cE44De21BEa',
  18,
  'bcBNB',
  'BlockNG-Peg BNB Token',
)

export const BLOCKNG_PEG_USDT_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xBc2F884680c95A02cea099dA2F524b366d9028Ba',
  18,
  'bcUSDT',
  'BlockNG-Peg USDT Token',
)

export const BLOCKNG_PEG_BUSD_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xbC6aEA0c2Cd7bFA073903ebdc23c8aAe79C7c826',
  18,
  'bcBUSD',
  'BlockNG-Peg BUSD Token',
)

export const BLOCKNG_PEG_USDC_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xBcbd9990dcEC6a64741ea27BeC0cA8ff6B91Bc26',
  18,
  'bcUSDC',
  'BlockNG-Peg USDC Token',
)

export const BLOCKNG_PEG_BTC_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xbC8643ceDd98F94756633f18945362d3B24283B8',
  18,
  'bcBTC',
  'BlockNG-Peg BTC Token',
)

export const BLOCKNG_PEG_ETH_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xbC7160974318820be438e54439b309921e96B62C',
  18,
  'bcETH',
  'BlockNG-Peg ETH Token',
)

export const BLOCKNG_PEG_DAI_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xBCCD70794BB199B0993E56Bfe277142246c2f43b',
  18,
  'bcDAI',
  'BlockNG-Peg DAI Token',
)

export const BLOCKNG_PEG_BCH_TOKEN = new Token(
  UniverseChainId.SmartBCH,
  '0xBc9bD8DDe6C5a8e1CBE293356E02f5984693b195',
  18,
  'bcBCH',
  'BlockNG-Peg BCH Token',
)

export const REWARD_LAMBO = new Token(
  UniverseChainId.SmartBCH,
  '0x99142F54c0D91A57370a535B8b4F3ac7137DE944',
  18,
  'RLAM',
  'Reward Lambo',
)

export const CRUDE_OIL = new Token(
  UniverseChainId.SmartBCH,
  '0x0C79358Aa7A319dB86470e566c292a6b529449b1',
  18,
  'OIL',
  'Crude Oil',
)

export const SBCH = new Token(
  UniverseChainId.SmartBCH,
  UNIVERSE_CHAIN_INFO[UniverseChainId.SmartBCH].nativeCurrency.address,
  UNIVERSE_CHAIN_INFO[UniverseChainId.SmartBCH].nativeCurrency.decimals,
  UNIVERSE_CHAIN_INFO[UniverseChainId.SmartBCH].nativeCurrency.symbol,
  UNIVERSE_CHAIN_INFO[UniverseChainId.SmartBCH].nativeCurrency.name,
)

export const WBCH = new Token(
  UniverseChainId.SmartBCH,
  '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04',
  18,
  'WBCH',
  'Wrapped BCH',
)

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token } = {
  ...(WETH9 as Record<UniverseChainId, Token>),
  [UniverseChainId.SmartBCH]: WBCH,
}

export function isCelo(chainId: number): chainId is UniverseChainId.Celo {
  return false
}

// Celo has a precompile for its native asset that is fully-compliant with ERC20 interface
// so we can treat it as an ERC20 token. (i.e. $CELO pools are created with its ERC20 precompile)
function getCeloNativeCurrency(chainId: number): Token {
  switch (chainId) {
    default:
      throw new Error('Not celo')
  }
}

export function isPolygon(chainId: number): chainId is UniverseChainId.Polygon {
  return false
}

// Polygon also has a precompile, but its precompile is not fully erc20-compatible.
// So we treat Polygon's native asset as NativeCurrency since we can't treat it like an ERC20 token.
class PolygonNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isPolygon(this.chainId)) {
      throw new Error('Not Polygon')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isPolygon(chainId)) {
      throw new Error('Not Polygon')
    }
    super(chainId, 18, 'POL', 'Polygon Ecosystem Token')
  }
}

export function isBsc(chainId: number): chainId is UniverseChainId.Bnb {
  return false
}

class BscNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isBsc(this.chainId)) {
      throw new Error('Not bnb')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isBsc(chainId)) {
      throw new Error('Not bnb')
    }
    super(chainId, 18, 'BNB', 'BNB')
  }
}

export function isAvalanche(chainId: number): chainId is UniverseChainId.Avalanche {
  return false
}

class AvaxNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isAvalanche(this.chainId)) {
      throw new Error('Not avalanche')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isAvalanche(chainId)) {
      throw new Error('Not avalanche')
    }
    super(chainId, 18, 'AVAX', 'AVAX')
  }
}

function isMonadTestnet(chainId: number): chainId is UniverseChainId.MonadTestnet {
  return false
}

// can reuse for monad mainnet when we add support
class MonadTestnetNativeCurrency extends NativeCurrency {
  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }

  get wrapped(): Token {
    if (!isMonadTestnet(this.chainId)) {
      throw new Error('Not monad testnet')
    }
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    invariant(wrapped instanceof Token)
    return wrapped
  }

  public constructor(chainId: number) {
    if (!isMonadTestnet(chainId)) {
      throw new Error('Not monad testnet')
    }
    super(chainId, 18, 'MON', 'MON')
  }
}

class ExtendedEther extends NativeCurrency {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) {
      return wrapped
    }
    throw new Error(`Unsupported chain ID: ${this.chainId}`)
  }

  protected constructor(chainId: number) {
    super(chainId, 18, 'BCH', 'Bitcoin Cash')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}
export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) {
    return cachedNativeCurrency[chainId] as NativeCurrency
  }
  let nativeCurrency: NativeCurrency | Token
  if (isPolygon(chainId)) {
    nativeCurrency = new PolygonNativeCurrency(chainId)
  } else if (isCelo(chainId)) {
    nativeCurrency = getCeloNativeCurrency(chainId)
  } else if (isBsc(chainId)) {
    nativeCurrency = new BscNativeCurrency(chainId)
  } else if (isAvalanche(chainId)) {
    nativeCurrency = new AvaxNativeCurrency(chainId)
  } else if (isMonadTestnet(chainId)) {
    nativeCurrency = new MonadTestnetNativeCurrency(chainId)
  } else {
    nativeCurrency = ExtendedEther.onChain(chainId)
  }
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}
