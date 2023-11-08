import { t } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import { BaseButton } from 'components/Button'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { WalletConnectV2 } from 'connection/WalletConnectV2'
import { getChainInfo } from 'constants/chainInfo'
import { getChainPriority, L1_CHAIN_IDS, L2_CHAIN_IDS, TESTNET_CHAIN_IDS } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { useAtomValue } from 'jotai/utils'
import { Portal } from 'nft/components/common/Portal'
import { Column } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { getSupportedChainIdsFromWalletConnectSession } from 'utils/getSupportedChainIdsFromWalletConnectSession'

import ChainSelectorRow from './ChainSelectorRow'
import { NavDropdown } from './NavDropdown'

const NETWORK_SELECTOR_CHAINS = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]

const ChainSelectorWrapper = styled.div`
  position: relative;
`

const ChainSelectorButton = styled(BaseButton)<{ isOpen: boolean }>`
  display: flex;
  background: ${({ theme, isOpen }) => (isOpen ? theme.accent2 : 'none')};
  padding: 10px 8px;
  gap: 4px;
  border-radius: 12px;
  height: 40px;
  color: ${({ theme }) => theme.neutral1};
  transition: ${({ theme }) =>
    `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color, ${theme.transition.duration.medium} ${theme.transition.timing.ease} margin`};

  &:hover {
    background-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
  }
`

function useWalletSupportedChains(): ChainId[] {
  const { connector } = useWeb3React()
  const connectionType = getConnection(connector).type

  switch (connectionType) {
    case ConnectionType.WALLET_CONNECT_V2:
    case ConnectionType.UNISWAP_WALLET_V2:
      return getSupportedChainIdsFromWalletConnectSession((connector as WalletConnectV2).provider?.session)
    default:
      return NETWORK_SELECTOR_CHAINS
  }
}

export const ChainSelector = ({ leftAlign }: { leftAlign?: boolean }) => {
  const { chainId } = useWeb3React()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const isMobile = useIsMobile()

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

  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setIsOpen(false), [modalRef])

  const info = getChainInfo(chainId)

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

  const isSupported = !!info

  const dropdown = (
    <NavDropdown top="56" left={leftAlign ? '0' : 'auto'} right={leftAlign ? 'auto' : '0'} ref={modalRef}>
      <Column paddingX="8" data-testid="chain-selector-options">
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
      </Column>
    </NavDropdown>
  )

  const chevronProps = {
    height: 20,
    width: 20,
    color: theme.neutral2,
  }

  return (
    <ChainSelectorWrapper ref={ref}>
      <MouseoverTooltip text={t`Your wallet's current network is unsupported.`} disabled={isSupported}>
        <ChainSelectorButton data-testid="chain-selector" onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
          {!isSupported ? (
            <AlertTriangle size={20} color={theme.neutral2} />
          ) : (
            <ChainLogo chainId={chainId} size={20} testId="chain-selector-logo" />
          )}
          {isOpen ? <ChevronUp {...chevronProps} /> : <ChevronDown {...chevronProps} />}
        </ChainSelectorButton>
      </MouseoverTooltip>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </ChainSelectorWrapper>
  )
}
