import { t } from '@lingui/macro'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { showTestnetsAtom } from 'components/AccountDrawer/TestnetsToggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { WalletConnectV2 } from 'connection/WalletConnectV2'
import { getChainInfo } from 'constants/chainInfo'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, TESTNET_CHAIN_IDS, UniWalletSupportedChains } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { useAtomValue } from 'jotai/utils'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'react-feather'
import { useTheme } from 'styled-components/macro'
import { getSupportedChainIdsFromWalletConnectSession } from 'utils/getSupportedChainIdsFromWalletConnectSession'

import * as styles from './ChainSelector.css'
import ChainSelectorRow from './ChainSelectorRow'
import { NavDropdown } from './NavDropdown'

const NETWORK_SELECTOR_CHAINS = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]

interface ChainSelectorProps {
  leftAlign?: boolean
}

function useWalletSupportedChains(): ChainId[] {
  const { connector } = useWeb3React()

  const connectionType = getConnection(connector).type

  switch (connectionType) {
    case ConnectionType.WALLET_CONNECT_V2:
      return getSupportedChainIdsFromWalletConnectSession((connector as WalletConnectV2).provider?.session)
    case ConnectionType.UNISWAP_WALLET_V2:
      return UniWalletSupportedChains
    default:
      return NETWORK_SELECTOR_CHAINS
  }
}

export const ChainSelector = ({ leftAlign }: ChainSelectorProps) => {
  const { chainId } = useWeb3React()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const isMobile = useIsMobile()

  const theme = useTheme()

  const showTestnets = useAtomValue(showTestnetsAtom)
  const walletSupportsChain = useWalletSupportedChains()

  const [supportedChains, unsupportedChains] = useMemo(() => {
    const { supported, unsupported } = NETWORK_SELECTOR_CHAINS.filter(
      (chain: number) => showTestnets || !TESTNET_CHAIN_IDS.includes(chain)
    ).reduce(
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

  const info = chainId ? getChainInfo(chainId) : undefined

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
    color: theme.textSecondary,
  }

  return (
    <Box position="relative" ref={ref}>
      <MouseoverTooltip text={t`Your wallet's current network is unsupported.`} disabled={isSupported}>
        <Row
          data-testid="chain-selector"
          as="button"
          gap="8"
          className={styles.ChainSelector}
          background={isOpen ? 'accentActiveSoft' : 'none'}
          onClick={() => setIsOpen(!isOpen)}
        >
          {!isSupported ? (
            <AlertTriangle size={20} color={theme.textSecondary} />
          ) : (
            <img src={info.logoUrl} alt={info.label} className={styles.Image} data-testid="chain-selector-logo" />
          )}
          {isOpen ? <ChevronUp {...chevronProps} /> : <ChevronDown {...chevronProps} />}
        </Row>
      </MouseoverTooltip>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </Box>
  )
}
