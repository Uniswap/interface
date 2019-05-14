import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'

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

const INITIAL_TOKENS_CONTEXT = {
  1: {
    ETH: {
      [NAME]: 'Ethereum',
      [SYMBOL]: 'ETH',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: null
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
    '0x41e5560054824eA6B0732E656E3Ad64E20e94E45': {
      [NAME]: 'Civic',
      [SYMBOL]: 'CVC',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0x1C6c712b1F4a7c263B1DBd8F97fb447c945d3b9a'
    },
    '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359': {
      [NAME]: 'Dai Stablecoin v1.0',
      [SYMBOL]: 'DAI',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x09cabEC1eAd1c0Ba254B09efb3EE13841712bE14'
    },
    '0x4f3AfEC4E5a3F2A6a1A411DEF7D7dFe50eE057bF': {
      [NAME]: 'Digix Gold Token',
      [SYMBOL]: 'DGX',
      [DECIMALS]: 9,
      [EXCHANGE_ADDRESS]: '0xb92dE8B30584392Af27726D5ce04Ef3c4e5c9924'
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
    '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd': {
      [NAME]: 'Gemini dollar',
      [SYMBOL]: 'GUSD',
      [DECIMALS]: 2,
      [EXCHANGE_ADDRESS]: '0xD883264737Ed969d2696eE4B4cAF529c2Fc2A141'
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
    '0xD29F0b5b3F50b07Fe9a9511F7d86F4f4bAc3f8c4': {
      [NAME]: 'Liquidity.Network Token',
      [SYMBOL]: 'LQD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xe3406e7D0155E0a83236eC25D34Cd3D903036669'
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
    '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942': {
      [NAME]: 'Decentraland MANA',
      [SYMBOL]: 'MANA',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xC6581Ce3A005e2801c1e0903281BBd318eC5B5C2'
    },
    '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2': {
      [NAME]: 'Maker',
      [SYMBOL]: 'MKR',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x2C4Bd064b998838076fa341A83d007FC2FA50957'
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
    '0x8E870D67F660D95d5be530380D0eC0bd388289E1': {
      [NAME]: 'PAX',
      [SYMBOL]: 'PAX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xC040d51b07Aea5d94a89Bc21E8078B77366Fc6C7'
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
    '0x607F4C5BB672230e8672085532f7e901544a7375': {
      [NAME]: 'iEx.ec Network Token',
      [SYMBOL]: 'RLC',
      [DECIMALS]: 9,
      [EXCHANGE_ADDRESS]: '0xA825CAE02B310E9901b4776806CE25db520c8642'
    },
    '0x4156D3342D5c385a87D264F90653733592000581': {
      [NAME]: 'Salt',
      [SYMBOL]: 'SALT',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0xC0C59cDe851bfcbdddD3377EC10ea54A18Efb937'
    },
    '0x744d70FDBE2Ba4CF95131626614a1763DF805B9E': {
      [NAME]: 'Status Network Token',
      [SYMBOL]: 'SNT',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x1aEC8F11A7E78dC22477e91Ed924Fab46e3A88Fd'
    },
    '0x3772f9716Cf6D7a09edE3587738AA2af5577483a': {
      [NAME]: 'Synthetix Network Token',
      [SYMBOL]: 'SNX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x5d8888a212d033cff5F2e0AC24ad91A5495bAD62'
    },
    '0x42d6622deCe394b54999Fbd73D108123806f6a18': {
      [NAME]: 'SPANK',
      [SYMBOL]: 'SPANK',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x4e395304655F0796bc3bc63709DB72173b9DdF98'
    },
    '0x0cbe2df57ca9191b64a7af3baa3f946fa7df2f25': {
      [NAME]: 'Synth sUSD',
      [SYMBOL]: 'sUSD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xA1ECDcca26150cF69090280eE2EE32347C238c7b'
    },
    '0xaAAf91D9b90dF800Df4F55c205fd6989c977E73a': {
      [NAME]: 'Monolith TKN',
      [SYMBOL]: 'TKN',
      [DECIMALS]: 8,
      [EXCHANGE_ADDRESS]: '0xb6cFBf322db47D39331E306005DC7E5e6549942B'
    },
    '0x8dd5fbCe2F6a956C3022bA3663759011Dd51e73E': {
      [NAME]: 'TrueUSD',
      [SYMBOL]: 'TUSD',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0x4F30E682D0541eAC91748bd38A648d759261b8f3'
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
    '0x05f4a42e251f2d52b8ed15E9FEdAacFcEF1FAD27': {
      [NAME]: 'Zilliqa',
      [SYMBOL]: 'ZIL',
      [DECIMALS]: 12,
      [EXCHANGE_ADDRESS]: '0x7dc095A5CF7D6208CC680fA9866F80a53911041a'
    },
    '0xE41d2489571d322189246DaFA5ebDe1F4699F498': {
      [NAME]: '0x Protocol Token',
      [SYMBOL]: 'ZRX',
      [DECIMALS]: 18,
      [EXCHANGE_ADDRESS]: '0xaE76c84C9262Cdb9abc0C2c8888e62Db8E22A0bF'
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

  const contextValue = useMemo(() => [state, { update }], [state, update])

  return <TokensContext.Provider value={contextValue}>{children}</TokensContext.Provider>
}

export function useTokenDetails(tokenAddress) {
  const { networkId, library } = useWeb3Context()

  const [state, { update }] = useTokensContext()
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals, [EXCHANGE_ADDRESS]: exchangeAddress } =
    safeAccess(state, [networkId, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined || exchangeAddress === undefined) &&
      (networkId || networkId === 0) &&
      library
    ) {
      let stale = false

      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(() => null)
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(() => null)
      const exchangeAddressPromise = getTokenExchangeAddressFromFactory(tokenAddress, networkId, library).catch(
        () => null
      )

      Promise.all([namePromise, symbolPromise, decimalsPromise, exchangeAddressPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress]) => {
          if (!stale) {
            update(networkId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress)
          }
        }
      )

      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, exchangeAddress, networkId, library, update])

  return { name, symbol, decimals, exchangeAddress }
}

export function useAllTokenDetails(requireExchange = true) {
  const { networkId } = useWeb3Context()

  const [state] = useTokensContext()
  const tokenDetails = safeAccess(state, [networkId]) || {}

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
