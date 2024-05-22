import { ChainId } from '@uniswap/sdk-core'
import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import { DropdownSelector, StyledMenuContent } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { CONNECTION } from 'components/Web3Provider/constants'
import { WalletConnectConnector } from 'components/Web3Provider/walletConnect'
import {
  L1_CHAIN_IDS,
  L2_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  getChainPriority,
  useIsSupportedChainId,
} from 'constants/chains'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { t } from 'i18n'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { css, useTheme } from 'styled-components'
import { useAccount, useChainId } from 'wagmi'

import ChainSelectorRow from './ChainSelectorRow'

const NETWORK_SELECTOR_CHAINS = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]

const StyledDropdownButton = css`
  display: flex;
  flex-direction: row;
  padding: 10px 8px;
  background: none;
  gap: 4px;
  border: none;
  & ${StyledMenuContent} {
    gap: 4px;
  }
`

const styledMobileMenuCss = css`
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.xs}px) {
    bottom: 50px;
  }
`

function useWalletSupportedChains(): ChainId[] {
  const { connector } = useAccount()

  switch (connector?.type) {
    case CONNECTION.UNISWAP_WALLET_CONNECT_CONNECTOR_ID:
    case CONNECTION.WALLET_CONNECT_CONNECTOR_ID:
      // Wagmi currently offers no way to discriminate a Connector as a WalletConnect connector providing access to getNamespaceChainsIds.
      return (connector as WalletConnectConnector).getNamespaceChainsIds?.() ?? NETWORK_SELECTOR_CHAINS
    default:
      return NETWORK_SELECTOR_CHAINS
  }
}

export const ChainSelector = ({ leftAlign }: { leftAlign?: boolean }) => {
  const disconnectedChainId = useChainId()
  const account = useAccount()
  const chainId = account?.chainId ?? disconnectedChainId
  const isSupportedChain = useIsSupportedChainId(chainId)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const theme = useTheme()

  const showTestnets = useAtomValue(showTestnetsAtom)
  const walletSupportsChain = useWalletSupportedChains()

  const [supportedChains, unsupportedChains] = useMemo(() => {
    const { supported, unsupported } = NETWORK_SELECTOR_CHAINS.filter((chain: number) => {
      return showTestnets || !TESTNET_CHAIN_IDS.includes(chain)
    })
      .sort((a, b) => getChainPriority(a) - getChainPriority(b))
      .reduce(
        (acc, chain) => {
          if (walletSupportsChain.includes(chain)) {
            acc.supported.push(chain)
          } else {
            acc.unsupported.push(chain)
          }
          return acc
        },
        { supported: [], unsupported: [] } as Record<string, ChainId[]>
      )
    return [supported, unsupported]
  }, [showTestnets, walletSupportsChain])

  const selectChain = useSelectChain()
  useSyncChainQuery()

  const [pendingChainId, setPendingChainId] = useState<ChainId | undefined>(undefined)

  const onSelectChain = useCallback(
    async (targetChainId: ChainId) => {
      setPendingChainId(targetChainId)
      await selectChain(targetChainId)
      setPendingChainId(undefined)
      setIsOpen(false)
    },
    [selectChain, setIsOpen]
  )

  if (!chainId) {
    return null
  }

  const styledMenuCss = css`
    ${leftAlign ? 'left: 0;' : 'right: 0;'}
    ${styledMobileMenuCss};
  `

  return (
    <DropdownSelector
      isOpen={isOpen}
      toggleOpen={() => setIsOpen(!isOpen)}
      menuLabel={
        !isSupportedChain ? (
          <AlertTriangle size={20} color={theme.neutral2} />
        ) : (
          <ChainLogo chainId={chainId} size={20} testId="chain-selector-logo" />
        )
      }
      tooltipText={isSupportedChain ? undefined : t`Your wallet's current network is unsupported.`}
      dataTestId="chain-selector"
      optionsContainerTestId="chain-selector-options"
      internalMenuItems={
        <>
          {supportedChains.map((selectorChain) => (
            <ChainSelectorRow
              disabled={!walletSupportsChain.includes(selectorChain)}
              onSelectChain={onSelectChain}
              targetChain={selectorChain}
              key={selectorChain}
              isPending={selectorChain === pendingChainId}
            />
          ))}
          {unsupportedChains.map((selectorChain) => (
            <ChainSelectorRow
              disabled
              onSelectChain={() => undefined}
              targetChain={selectorChain}
              key={selectorChain}
              isPending={false}
            />
          ))}
        </>
      }
      buttonCss={StyledDropdownButton}
      menuFlyoutCss={styledMenuCss}
    />
  )
}
