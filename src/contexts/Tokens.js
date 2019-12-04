import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'

import { useWeb3React } from '../hooks'
import {
  isAddress,
  getTokenName,
  getTokenSymbol,
  getTokenDecimals,
  getTokenExchangeAddressFromFactory,
  safeAccess
} from '../utils'

const NAME = 'name'
const SYMBOL = 'symbol'
const DECIMALS = 'decimals'
const EXCHANGE_ADDRESS = 'exchangeAddress'

const UPDATE = 'UPDATE'

const ETH = {
  ETH: {
    [NAME]: 'Ethereum',
    [SYMBOL]: 'ETH',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null
  }
}

const INITIAL_TOKENS_CONTEXT = {
  1: {
    '0x737F98AC8cA59f2C68aD658E3C3d8C8963E40a4c': {
      [NAME]: 'Amon',
      [SYMBOL]: 'AMN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xE6C198d27a5B71144B40cFa2362ae3166728e0C8'
    },
    '0xD46bA6D942050d489DBd938a2C909A5d5039A161': {
      [NAME]: 'Ampleforth',
      [SYMBOL]: 'AMPL',
      [DECIMALS]: 9,
      [EXCHANGE_ADDRESS]: '0x042dBBDc27F75d277C3D99efE327DB21Bc4fde75'
    },
    '0x960b236A07cf122663c4303350609A66A7B288C0': {
      [NAME]: 'Aragon Network Token',
      [SYMBOL]: 'ANT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x077d52B047735976dfdA76feF74d4d988AC25196'
    },
    '0x0D8775F648430679A709E98d2b0Cb6250d2887EF': {
      [NAME]: 'Basic Attention Token',
      [SYMBOL]: 'BAT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x2E642b8D59B45a1D8c5aEf716A84FF44ea665914'
    },
    '0x107c4504cd79C5d2696Ea0030a8dD4e92601B82e': {
      [NAME]: 'Bloom Token',
      [SYMBOL]: 'BLT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x0E6A53B13688018A3df8C69f99aFB19A3068D04f'
    },
    '0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C': {
      [NAME]: 'Bancor Network Token',
      [SYMBOL]: 'BNT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x87d80DBD37E551F58680B4217b23aF6a752DA83F'
    },
    '0x26E75307Fc0C021472fEb8F727839531F112f317': {
      [NAME]: 'Crypto20',
      [SYMBOL]: 'C20',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xF7B5A4b934658025390ff69dB302BC7F2AC4a542'
    },
    '0xF5DCe57282A584D2746FaF1593d3121Fcac444dC': {
      [NAME]: 'Compound Dai',
      [SYMBOL]: 'cSAI',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x45A2FDfED7F7a2c791fb1bdF6075b83faD821ddE'
    },
    '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643': {
      [NAME]: 'Compound Dai',
      [SYMBOL]: 'cDAI',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x34E89740adF97C3A9D3f63Cc2cE4a914382c230b'
    },
    '0x06AF07097C9Eeb7fD685c692751D5C66dB49c215': {
      [NAME]: 'Chai',
      [SYMBOL]: 'CHAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x6C3942B383bc3d0efd3F36eFa1CBE7C8E12C8A2B'
    },
    '0x41e5560054824eA6B0732E656E3Ad64E20e94E45': {
      [NAME]: 'Civic',
      [SYMBOL]: 'CVC',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x1C6c712b1F4a7c263B1DBd8F97fb447c945d3b9a'
    },
    '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359': {
      [NAME]: 'Dai Stablecoin v1.0 (SAI)',
      [SYMBOL]: 'SAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14'
    },
    '0x0Cf0Ee63788A0849fE5297F3407f701E122cC023': {
      [NAME]: 'Streamr DATAcoin',
      [SYMBOL]: 'DATA',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x4F0d6E2179938828CfF93dA40a8BA1Df7519Ca8C'
    },
    '0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A': {
      [NAME]: 'DigixDAO',
      [SYMBOL]: 'DGD',
      [DECIMALS]: 9,
      [EXCHANGE_ADDRESS]: '0xD55C1cA9F5992A2e5E379DCe49Abf24294ABe055'
    },
    '0x4f3AfEC4E5a3F2A6a1A411DEF7D7dFe50eE057bF': {
      [NAME]: 'Digix Gold Token',
      [SYMBOL]: 'DGX',
      [DECIMALS]: 9,
      [EXCHANGE_ADDRESS]: '0xb92dE8B30584392Af27726D5ce04Ef3c4e5c9924'
    },
    '0xc719d010B63E5bbF2C0551872CD5316ED26AcD83': {
      [NAME]: 'Decentralized Insurance Protocol',
      [SYMBOL]: 'DIP',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x61792F290e5100FBBcBb2309F03A1Bab869fb850'
    },
    '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c': {
      [NAME]: 'Enjin Coin',
      [SYMBOL]: 'ENJ',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xb99A23b1a4585fc56d0EC3B76528C27cAd427473'
    },
    '0x4946Fcea7C692606e8908002e55A582af44AC121': {
      [NAME]: 'FOAM Token',
      [SYMBOL]: 'FOAM',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xf79cb3BEA83BD502737586A6E8B133c378FD1fF2'
    },
    '0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b': {
      [NAME]: 'FunFair',
      [SYMBOL]: 'FUN',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x60a87cC7Fca7E53867facB79DA73181B1bB4238B'
    },
    '0x543Ff227F64Aa17eA132Bf9886cAb5DB55DCAddf': {
      [NAME]: 'DAOstack',
      [SYMBOL]: 'GEN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x26Cc0EAb6Cb650B0Db4D0d0dA8cB5BF69F4ad692'
    },
    '0x6810e776880C02933D47DB1b9fc05908e5386b96': {
      [NAME]: 'Gnosis Token',
      [SYMBOL]: 'GNO',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xe8e45431b93215566BA923a7E611B7342Ea954DF'
    },
    '0x12B19D3e2ccc14Da04FAe33e63652ce469b3F2FD': {
      [NAME]: 'GRID Token',
      [SYMBOL]: 'GRID',
      [DECIMALS]: 12,
      [EXCHANGE_ADDRESS]: '0x4B17685b330307C751B47f33890c8398dF4Fe407'
    },
    '0x14094949152EDDBFcd073717200DA82fEd8dC960': {
      [NAME]: 'bZx DAI iToken ',
      [SYMBOL]: 'iDAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x81eeD7F1EcbD7FA9978fcc7584296Fb0C215Dc5C'
    },
    '0x6fB3e0A217407EFFf7Ca062D46c26E5d60a14d69': {
      [NAME]: 'IoTeX Network',
      [SYMBOL]: 'IOTX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x084f002671a5f03D5498B1e5fb15fc0cfee9a470'
    },
    '0x818Fc6C2Ec5986bc6E2CBf00939d90556aB12ce5': {
      [NAME]: 'Kin',
      [SYMBOL]: 'KIN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xb7520a5F8c832c573d6BD0Df955fC5c9b72400F7'
    },
    '0xdd974D5C2e2928deA5F71b9825b8b646686BD200': {
      [NAME]: 'Kyber Network Crystal',
      [SYMBOL]: 'KNC',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x49c4f9bc14884f6210F28342ceD592A633801a8b'
    },
    '0x514910771AF9Ca656af840dff83E8264EcF986CA': {
      [NAME]: 'ChainLink Token',
      [SYMBOL]: 'LINK',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xF173214C720f58E03e194085B1DB28B50aCDeeaD'
    },
    '0x6c6EE5e31d828De241282B9606C8e98Ea48526E2': {
      [NAME]: 'HoloToken',
      [SYMBOL]: 'HOT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xd4777E164c6C683E10593E08760B803D58529a8E'
    },
    '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD': {
      [NAME]: 'LoopringCoin V2',
      [SYMBOL]: 'LRC',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA539BAaa3aCA455c986bB1E25301CEF936CE1B65'
    },
    '0x80fB784B7eD66730e8b1DBd9820aFD29931aab03': {
      [NAME]: 'EthLend Token',
      [SYMBOL]: 'LEND',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xcaA7e4656f6A2B59f5f99c745F91AB26D1210DCe'
    },
    '0xA4e8C3Ec456107eA67d3075bF9e3DF3A75823DB0': {
      [NAME]: 'LoomToken',
      [SYMBOL]: 'LOOM',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x417CB32bc991fBbDCaE230C7c4771CC0D69daA6b'
    },
    '0x58b6A8A3302369DAEc383334672404Ee733aB239': {
      [NAME]: 'Livepeer Token',
      [SYMBOL]: 'LPT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xc4a1C45D5546029Fd57128483aE65b56124BFA6A'
    },
    '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4': {
      [NAME]: 'Liquidity.Network Token',
      [SYMBOL]: 'LQD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xe3406e7D0155E0a83236eC25D34Cd3D903036669'
    },
    '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942': {
      [NAME]: 'Decentraland MANA',
      [SYMBOL]: 'MANA',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xC6581Ce3A005e2801c1e0903281BBd318eC5B5C2'
    },
    '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': {
      [NAME]: 'Matic Token',
      [SYMBOL]: 'MATIC',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x9a7A75E66B325a3BD46973B2b57c9b8d9D26a621'
    },
    '0x8888889213DD4dA823EbDD1e235b09590633C150': {
      [NAME]: 'Marblecoin',
      [SYMBOL]: 'MBC',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xE1b7AeC3639068b474bFbcB916580fc28A20717B'
    },
    '0x80f222a749a2e18Eb7f676D371F19ad7EFEEe3b7': {
      [NAME]: 'Magnolia Token',
      [SYMBOL]: 'MGN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xdd80Ca8062c7Ef90FcA2547E6a2A126C596e611F'
    },
    '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2': {
      [NAME]: 'Maker',
      [SYMBOL]: 'MKR',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x2C4Bd064b998838076fa341A83d007FC2FA50957'
    },
    '0xec67005c4E498Ec7f55E092bd1d35cbC47C91892': {
      [NAME]: 'Melon Token',
      [SYMBOL]: 'MLN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA931F4eB165AC307fD7431b5EC6eADde53E14b0C'
    },
    '0x957c30aB0426e0C93CD8241E2c60392d08c6aC8e': {
      [NAME]: 'Modum Token',
      [SYMBOL]: 'MOD',
      [DECIMALS]: 0,
      [EXCHANGE_ADDRESS]: '0xCCB98654CD486216fFF273dd025246588E77cFC1'
    },
    '0xB62132e35a6c13ee1EE0f84dC5d40bad8d815206': {
      [NAME]: 'Nexo',
      [SYMBOL]: 'NEXO',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x069C97DBA948175D10af4b2414969e0B88d44669'
    },
    '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671': {
      [NAME]: 'Numeraire',
      [SYMBOL]: 'NMR',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x2Bf5A5bA29E60682fC56B2Fcf9cE07Bef4F6196f'
    },
    '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44': {
      [NAME]: 'Panvala pan',
      [SYMBOL]: 'PAN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xF53bBFBff01c50F2D42D542b09637DcA97935fF7'
    },
    '0x8E870D67F660D95d5be530380D0eC0bd388289E1': {
      [NAME]: 'PAX',
      [SYMBOL]: 'PAX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xC040d51b07Aea5d94a89Bc21E8078B77366Fc6C7'
    },
    '0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d': {
      [NAME]: 'Pinakion',
      [SYMBOL]: 'PNK',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xF506828B166de88cA2EDb2A98D960aBba0D2402A'
    },
    '0x6758B7d441a9739b98552B373703d8d3d14f9e62': {
      [NAME]: 'POA ERC20 on Foundation',
      [SYMBOL]: 'POA20',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA2E6B3EF205FeAEe475937c4883b24E6eB717eeF'
    },
    '0x687BfC3E73f6af55F0CccA8450114D107E781a0e': {
      [NAME]: 'QChi',
      [SYMBOL]: 'QCH',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x755899F0540c3548b99E68C59AdB0f15d2695188'
    },
    '0x99ea4dB9EE77ACD40B119BD1dC4E33e1C070b80d': {
      [NAME]: 'Quantstamp Token',
      [SYMBOL]: 'QSP',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x82Db9FC4956Fa40efe1e35d881004612B5CB2cc2'
    },
    '0xF970b8E36e23F7fC3FD752EeA86f8Be8D83375A6': {
      [NAME]: 'Ripio Credit Network Token',
      [SYMBOL]: 'RCN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xD91FF16Ef92568fC27F466C3c5613e43313Ab1dc'
    },
    '0x255Aa6DF07540Cb5d3d297f0D0D4D84cb52bc8e6': {
      [NAME]: 'Raiden Token',
      [SYMBOL]: 'RDN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x7D03CeCb36820b4666F45E1b4cA2538724Db271C'
    },
    '0x408e41876cCCDC0F92210600ef50372656052a38': {
      [NAME]: 'Republic Token',
      [SYMBOL]: 'REN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x43892992B0b102459E895B88601Bb2C76736942c'
    },
    '0x1985365e9f78359a9B6AD760e32412f4a445E862': {
      [NAME]: 'Reputation',
      [SYMBOL]: 'REP',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x48B04d2A05B6B604d8d5223Fd1984f191DED51af'
    },
    '0x168296bb09e24A88805CB9c33356536B980D3fC5': {
      [NAME]: 'RHOC',
      [SYMBOL]: 'RHOC',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x394e524b47A3AB3D3327f7fF6629dC378c1494a3'
    },
    '0x9469D013805bFfB7D3DEBe5E7839237e535ec483': {
      [NAME]: 'Darwinia Network Native Token',
      [SYMBOL]: 'RING',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xeBD8AA50b26bFa63007d61eBa777A9DdE7e43c64'
    },
    '0x607F4C5BB672230e8672085532f7e901544a7375': {
      [NAME]: 'iEx.ec Network Token',
      [SYMBOL]: 'RLC',
      [DECIMALS]: 9,
      [EXCHANGE_ADDRESS]: '0xA825CAE02B310E9901b4776806CE25db520c8642'
    },
    '0xB4EFd85c19999D84251304bDA99E90B92300Bd93': {
      [NAME]: 'Rocket Pool',
      [SYMBOL]: 'RPL',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x3Fb2F18065926DdB33E7571475c509541d15dA0e'
    },
    '0x4156D3342D5c385a87D264F90653733592000581': {
      [NAME]: 'Salt',
      [SYMBOL]: 'SALT',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0xC0C59cDe851bfcbdddD3377EC10ea54A18Efb937'
    },
    '0x7C5A0CE9267ED19B22F8cae653F198e3E8daf098': {
      [NAME]: 'SANtiment network token',
      [SYMBOL]: 'SAN',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x8a8D7aD4b89D91983cd069C58C4AA9F2f4166298'
    },
    '0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb': {
      [NAME]: 'Synth sETH',
      [SYMBOL]: 'sETH',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xe9Cf7887b93150D4F2Da7dFc6D502B216438F244'
    },
    '0x3A9FfF453d50D4Ac52A6890647b823379ba36B9E': {
      [NAME]: 'Shuffle.Monster V3',
      [SYMBOL]: 'SHUF',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x536956Fab86774fb55CfaAcF496BC25E4d2B435C'
    },
    '0x744d70FDBE2Ba4CF95131626614a1763DF805B9E': {
      [NAME]: 'Status Network Token',
      [SYMBOL]: 'SNT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x1aEC8F11A7E78dC22477e91Ed924Fab46e3A88Fd'
    },
    '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F': {
      [NAME]: 'Synthetix Network Token',
      [SYMBOL]: 'SNX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x3958B4eC427F8fa24eB60F42821760e88d485f7F'
    },
    '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5': {
      [NAME]: 'Unisocks Edition 0',
      [SYMBOL]: 'SOCKS',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x22d8432cc7aA4f8712a655fC4cdfB1baEC29FCA9'
    },
    '0x42d6622deCe394b54999Fbd73D108123806f6a18': {
      [NAME]: 'SPANK',
      [SYMBOL]: 'SPANK',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x4e395304655F0796bc3bc63709DB72173b9DdF98'
    },
    '0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC': {
      [NAME]: 'StorjToken',
      [SYMBOL]: 'STORJ',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0xA7298541E52f96d42382eCBe4f242cBcBC534d02'
    },
    '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51': {
      [NAME]: 'Synth sUSD',
      [SYMBOL]: 'sUSD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xB944d13b2f4047fc7bd3F7013bcf01b115fb260d'
    },
    '0x00006100F7090010005F1bd7aE6122c3C2CF0090': {
      [NAME]: 'TrueAUD',
      [SYMBOL]: 'TAUD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x88dF13889E20EFa93Ff9a0C08f101F431bD9DDD7'
    },
    '0x00000100F2A2bd000715001920eB70D229700085': {
      [NAME]: 'TrueCAD',
      [SYMBOL]: 'TCAD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xF996D7d9BaCb9217ca64BBce1b1cD72E0E886Be6'
    },
    '0x00000000441378008EA67F4284A57932B1c000a5': {
      [NAME]: 'TrueGBP',
      [SYMBOL]: 'TGBP',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x6bFa119a191576Ba26Bc5e711432aCA0cFda04DE'
    },
    '0x0000852600CEB001E08e00bC008be620d60031F2': {
      [NAME]: 'TrueHKD',
      [SYMBOL]: 'THKD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x505C02B4aa1286375FBDF0c390AC0fe9209DCB05'
    },
    '0xaAAf91D9b90dF800Df4F55c205fd6989c977E73a': {
      [NAME]: 'Monolith TKN',
      [SYMBOL]: 'TKN',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0xb6cFBf322db47D39331E306005DC7E5e6549942B'
    },
    '0x2C537E5624e4af88A7ae4060C022609376C8D0EB': {
      [NAME]: 'BiLira',
      [SYMBOL]: 'TRYB',
      [DECIMALS]: 6,
      [EXCHANGE_ADDRESS]: '0x122327Fd43B2C66DD9e4B6c91c8f071E217558eF'
    },
    '0x0000000000085d4780B73119b644AE5ecd22b376': {
      [NAME]: 'TrueUSD',
      [SYMBOL]: 'TUSD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x5048b9d01097498Fd72F3F14bC9Bc74A5aAc8fA7'
    },
    '0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14': {
      [NAME]: 'Uniswap V1',
      [SYMBOL]: 'UNI-V1:SAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x601c32E0580D3aef9437dB52D09f5a5D7E60eC22'
    },
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      [NAME]: 'USD//C',
      [SYMBOL]: 'USDC',
      [DECIMALS]: 6,
      [EXCHANGE_ADDRESS]: '0x97deC872013f6B5fB443861090ad931542878126'
    },
    '0x8f3470A7388c05eE4e7AF3d01D8C722b0FF52374': {
      [NAME]: 'Veritaseum',
      [SYMBOL]: 'VERI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x17e5BF07D696eaf0d14caA4B44ff8A1E17B34de3'
    },
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': {
      [NAME]: 'Wrapped BTC',
      [SYMBOL]: 'WBTC',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x4d2f5cFbA55AE412221182D8475bC85799A5644b'
    },
    '0x09fE5f0236F0Ea5D930197DCE254d77B04128075': {
      [NAME]: 'Wrapped CryptoKitties',
      [SYMBOL]: 'WCK',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x4FF7Fa493559c40aBd6D157a0bfC35Df68d8D0aC'
    },
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
      [NAME]: 'Wrapped Ether',
      [SYMBOL]: 'WETH',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA2881A90Bf33F03E7a3f803765Cd2ED5c8928dFb'
    },
    '0xB4272071eCAdd69d933AdcD19cA99fe80664fc08': {
      [NAME]: 'CryptoFranc',
      [SYMBOL]: 'XCHF',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x8dE0d002DC83478f479dC31F76cB0a8aa7CcEa17'
    },
    '0xE41d2489571d322189246DaFA5ebDe1F4699F498': {
      [NAME]: '0x Protocol Token',
      [SYMBOL]: 'ZRX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xaE76c84C9262Cdb9abc0C2c8888e62Db8E22A0bF'
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      [NAME]: 'Dai Stablecoin',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667'
    }
  },
  4: {
    '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa': {
      [NAME]: 'Dai',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xaF51BaAA766b65E8B3Ee0C2c33186325ED01eBD5'
    }
  }
}

const TokensContext = createContext()

function useTokensContext() {
  return useContext(TokensContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals,
            [EXCHANGE_ADDRESS]: exchangeAddress
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_TOKENS_CONTEXT)

  const update = useCallback((networkId, tokenAddress, name, symbol, decimals, exchangeAddress) => {
    dispatch({ type: UPDATE, payload: { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } })
  }, [])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokenDetails(tokenAddress) {
  const { library, chainId } = useWeb3React()

  const [state, { update }] = useTokensContext()
  const allTokensInNetwork = { ...ETH, ...(safeAccess(state, [chainId]) || {}) }
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals, [EXCHANGE_ADDRESS]: exchangeAddress } =
    safeAccess(allTokensInNetwork, [tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined || exchangeAddress === undefined) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false

      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(() => null)
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(() => null)
      const exchangeAddressPromise = getTokenExchangeAddressFromFactory(tokenAddress, chainId, library).catch(
        () => null
      )

      Promise.all([namePromise, symbolPromise, decimalsPromise, exchangeAddressPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress]) => {
          if (!stale) {
            update(chainId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress)
          }
        }
      )
      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, exchangeAddress, chainId, library, update])

  return { name, symbol, decimals, exchangeAddress }
}

export function useAllTokenDetails(requireExchange = true) {
  const { chainId } = useWeb3React()

  const [state] = useTokensContext()
  const tokenDetails = { ...ETH, ...(safeAccess(state, [chainId]) || {}) }

  return requireExchange
    ? Object.keys(tokenDetails)
        .filter(
          tokenAddress =>
            tokenAddress === 'ETH' ||
            (safeAccess(tokenDetails, [tokenAddress, EXCHANGE_ADDRESS]) &&
              safeAccess(tokenDetails, [tokenAddress, EXCHANGE_ADDRESS]) !== ethers.constants.AddressZero)
        )
        .reduce((accumulator, tokenAddress) => {
          accumulator[tokenAddress] = tokenDetails[tokenAddress]
          return accumulator
        }, {})
    : tokenDetails
}
