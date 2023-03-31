import { TokenList, VersionUpgrade } from '@uniswap/token-lists'

import { shouldAcceptVersionUpdate } from './utils'

function buildTokenList(count: number): TokenList {
  const tokens = []
  for (let i = 0; i < count; i++) {
    tokens.push({
      name: `Token ${i}`,
      address: `0x${i.toString().padStart(40, '0')}`,
      symbol: `T${i}`,
      decimals: 18,
      chainId: 1,
      logoURI: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x${i
        .toString()
        .padStart(40, '0')}/logo.png`,
    })
  }
  return {
    name: 'Defi',
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    keywords: ['defi', 'uniswap'],
    timestamp: '2021-03-12T00:00:00.000Z',
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    tokens,
  }
}

describe('shouldAcceptMinorVersionUpdate', () => {
  it('returns false for patch when tokens have changed', () => {
    expect(shouldAcceptVersionUpdate('test_list', buildTokenList(1), buildTokenList(2), VersionUpgrade.PATCH)).toEqual(
      false
    )
  })

  it('returns true for patch when tokens are the same', () => {
    expect(shouldAcceptVersionUpdate('test_list', buildTokenList(1), buildTokenList(1), VersionUpgrade.PATCH)).toEqual(
      true
    )
  })

  it('returns true for minor version bump with tokens added', () => {
    expect(shouldAcceptVersionUpdate('test_list', buildTokenList(1), buildTokenList(2), VersionUpgrade.MINOR)).toEqual(
      true
    )
  })

  it('returns true for no version bump', () => {
    expect(shouldAcceptVersionUpdate('test_list', buildTokenList(1), buildTokenList(2), VersionUpgrade.MINOR)).toEqual(
      true
    )
  })

  it('returns false for minor version bump with tokens removed', () => {
    expect(shouldAcceptVersionUpdate('test_list', buildTokenList(2), buildTokenList(1), VersionUpgrade.MINOR)).toEqual(
      false
    )
  })
})
