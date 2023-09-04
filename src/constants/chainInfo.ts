import { ChainId } from '@kinetix/sdk-core'
import kavaLogo from 'assets/svg/kava-logo.png'
import ms from 'ms'
import { darkTheme } from 'theme/colors'

import { SupportedL1ChainId, SupportedL2ChainId } from './chains'
import { KAVA_LIST } from './lists'

export const AVERAGE_L1_BLOCK_TIME = ms(`12s`)

export enum NetworkType {
  L1,
  L2,
}
interface BaseChainInfo {
  readonly networkType: NetworkType
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly logoUrl: string
  readonly circleLogoUrl?: string
  readonly squareLogoUrl?: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
  readonly color?: string
  readonly backgroundColor?: string
}

interface L1ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L1
  readonly defaultListUrl?: string
}

export interface L2ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L2
  readonly bridge: string
  readonly statusPage?: string
  readonly defaultListUrl: string
}

type ChainInfoMap =
  | { readonly [chainId: number]: L1ChainInfo | L2ChainInfo }
  | { readonly [chainId in SupportedL2ChainId]: L2ChainInfo }
  | { readonly [chainId in SupportedL1ChainId]: L1ChainInfo }

// type ChainInfoMap = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo }

const CHAIN_INFO: ChainInfoMap = {
  [ChainId.KAVA]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://cbridge.celer.network/1/2222',
    docs: 'https://docs.kava.io/',
    explorer: 'https://kavascan.com/',
    infoLink: 'https://info.kinetix.finance/#/kava',
    label: 'KAVA',
    logoUrl: kavaLogo,
    circleLogoUrl: kavaLogo,
    squareLogoUrl: kavaLogo,
    nativeCurrency: { name: 'KAVA', symbol: 'KAVA', decimals: 18 },
    defaultListUrl: KAVA_LIST,
    color: darkTheme.chain_2222,
    backgroundColor: darkTheme.chain_2222_background,
  },
} as const

export function getChainInfo(
  chainId: SupportedL1ChainId,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L1ChainInfo
export function getChainInfo(
  chainId: SupportedL2ChainId,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L2ChainInfo
export function getChainInfo(
  chainId: ChainId,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L1ChainInfo | L2ChainInfo
export function getChainInfo(
  chainId: ChainId | SupportedL1ChainId | SupportedL2ChainId | number | undefined,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L1ChainInfo | L2ChainInfo | undefined

/**
 * Overloaded method for returning ChainInfo given a chainID
 * Return type varies depending on input type:
 * number | undefined -> returns chaininfo | undefined
 * ChainId -> returns L1ChainInfo | L2ChainInfo
 * SupportedL1ChainId -> returns L1ChainInfo
 * SupportedL2ChainId -> returns L2ChainInfo
 */
export function getChainInfo(
  chainId: any,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): any {
  if (featureFlags && chainId in featureFlags) {
    // @ts-ignore
    return featureFlags[chainId] ? CHAIN_INFO[chainId] : undefined
  }
  if (chainId) {
    // @ts-ignore
    return CHAIN_INFO[chainId] ?? undefined
  }
  return undefined
}

const MAINNET_INFO = CHAIN_INFO[ChainId.KAVA]
export function getChainInfoOrDefault(chainId: number | undefined, featureFlags?: Record<number, boolean>) {
  return getChainInfo(chainId, featureFlags) ?? MAINNET_INFO
}
