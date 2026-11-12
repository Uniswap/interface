import { UniverseChainId } from '@universe/chains'
import { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { getHookDetailsURL } from 'uniswap/src/utils/linking'
import { HookDetailsStatus } from '~/pages/HookDetails/types'
import { getHookDetailReferrer, getHookDetailRouteState } from '~/pages/HookDetails/utils/route'

const HOOK_ADDRESS = '0x000000000000000000000000000000000000abcd'
const isSupportedChain = (): boolean => true

describe('getHookDetailRouteState', () => {
  it.each([
    ['ethereum', UniverseChainId.Mainnet],
    ['base', UniverseChainId.Base],
    ['arbitrum', UniverseChainId.ArbitrumOne],
  ] as const)('retains the selected EVM network %s', (chainName, chainId) => {
    expect(getHookDetailRouteState({ chainName, hookAddress: HOOK_ADDRESS }, isSupportedChain)).toEqual({
      status: HookDetailsStatus.Valid,
      chainId,
      hookAddress: HOOK_ADDRESS,
    })
  })

  it.each(['0x000000000000000000000000000000000000ABcD', '0X000000000000000000000000000000000000ABCD'])(
    'normalizes case before validating an EVM identity: %s',
    (hookAddress) => {
      expect(getHookDetailRouteState({ chainName: 'base', hookAddress }, isSupportedChain)).toEqual({
        status: HookDetailsStatus.Valid,
        chainId: UniverseChainId.Base,
        hookAddress: HOOK_ADDRESS,
      })
    },
  )

  it.each([undefined, '', 'unknown', 'solana', 'BASE', '8453'])(
    'does not reinterpret an unsupported or absent network: %s',
    (chainName) => {
      expect(getHookDetailRouteState({ chainName, hookAddress: HOOK_ADDRESS }, isSupportedChain)).toEqual({
        status: HookDetailsStatus.UnsupportedChain,
      })
    },
  )

  it.each([
    undefined,
    '',
    'hook.eth',
    'abcd',
    '000000000000000000000000000000000000abcd',
    '0x1234',
    `${HOOK_ADDRESS}0`,
    '0x000000000000000000000000000000000000abcz',
    ` ${HOOK_ADDRESS}`,
    `${HOOK_ADDRESS} `,
  ])('rejects malformed or nonhex addresses: %s', (hookAddress) => {
    expect(getHookDetailRouteState({ chainName: 'base', hookAddress }, isSupportedChain)).toEqual({
      status: HookDetailsStatus.InvalidAddress,
    })
  })

  it('rejects a known EVM network when it is disabled', () => {
    expect(getHookDetailRouteState({ chainName: 'base', hookAddress: HOOK_ADDRESS }, () => false)).toEqual({
      status: HookDetailsStatus.UnsupportedChain,
    })
  })
})

describe('getHookDetailReferrer', () => {
  it.each([HookDetailsReferrer.List, HookDetailsReferrer.Badge] as const)(
    'reads a single %s origin from the shared helper',
    (referrer) => {
      const url = new URL(
        getHookDetailsURL({ hookAddress: HOOK_ADDRESS, chainId: UniverseChainId.Base, referrer }),
        'https://app.uniswap.org',
      )

      expect(getHookDetailReferrer(url.searchParams)).toBe(referrer)
    },
  )

  it.each([
    '',
    'hookReferrer=',
    'hookReferrer=external',
    'hookReferrer=unknown',
    'hookReferrer=List',
    'hookReferrer=%20list',
    'hookReferrer=list&hookReferrer=badge',
    'hookReferrer=list&hookReferrer=list',
    'hookReferrer=&hookReferrer=badge',
  ])('uses external for an absent, invalid or repeated origin: %s', (query) => {
    expect(getHookDetailReferrer(new URLSearchParams(query))).toBe(HookDetailsReferrer.External)
  })
})
