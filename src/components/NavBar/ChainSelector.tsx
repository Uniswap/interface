import { t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect-v2'
import { MouseoverTooltip } from 'components/Tooltip'
import { getConnection } from 'connection'
import { ConnectionType } from 'connection/types'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId, UniWalletSupportedChains } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'react-feather'
import { useTheme } from 'styled-components/macro'
import { isProductionEnv } from 'utils/env'

import * as styles from './ChainSelector.css'
import ChainSelectorRow from './ChainSelectorRow'
import { NavDropdown } from './NavDropdown'

const NETWORK_SELECTOR_CHAINS = [
  SupportedChainId.MAINNET,
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.CELO,
  SupportedChainId.BNB,
]

if (!isProductionEnv()) {
  NETWORK_SELECTOR_CHAINS.push(SupportedChainId.SEPOLIA)
}

interface ChainSelectorProps {
  leftAlign?: boolean
}

// accounts is an array of strings in the format of "eip155:<chainId>:<address>"
function getChainsFromEIP155Accounts(accounts?: string[]): SupportedChainId[] {
  if (!accounts) return []
  return accounts
    .map((account) => {
      const splitAccount = account.split(':')
      return splitAccount[1] ? parseInt(splitAccount[1]) : undefined
    })
    .filter((x) => x !== undefined) as SupportedChainId[]
}

function useWalletSupportedChains() {
  const { connector } = useWeb3React()

  const connectionType = getConnection(connector).type

  switch (connectionType) {
    case ConnectionType.WALLET_CONNECT_V2:
      return getChainsFromEIP155Accounts((connector as WalletConnect).provider?.session?.namespaces.eip155.accounts)
    case ConnectionType.UNISWAP_WALLET:
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

  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setIsOpen(false), [modalRef])

  const info = chainId ? getChainInfo(chainId) : undefined

  const selectChain = useSelectChain()
  useSyncChainQuery()

  const [pendingChainId, setPendingChainId] = useState<SupportedChainId | undefined>(undefined)

  const onSelectChain = useCallback(
    async (targetChainId: SupportedChainId) => {
      setPendingChainId(targetChainId)
      await selectChain(targetChainId)
      setPendingChainId(undefined)
      setIsOpen(false)
    },
    [selectChain, setIsOpen]
  )

  const walletSupportsChain = useWalletSupportedChains()

  if (!chainId) {
    return null
  }

  const isSupported = !!info

  const dropdown = (
    <NavDropdown top="56" left={leftAlign ? '0' : 'auto'} right={leftAlign ? 'auto' : '0'} ref={modalRef}>
      <Column paddingX="8">
        {NETWORK_SELECTOR_CHAINS.map((selectorChain: SupportedChainId) => (
          <ChainSelectorRow
            disabled={!walletSupportsChain.includes(selectorChain)}
            onSelectChain={onSelectChain}
            targetChain={selectorChain}
            key={selectorChain}
            isPending={selectorChain === pendingChainId}
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
