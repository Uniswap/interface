import { t } from '@lingui/macro'
import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import { MouseoverTooltip } from 'components/Tooltip'
import { ConnectionType } from 'connection'
import { useGetConnection } from 'connection'
import { WalletConnectV2 } from 'connection/WalletConnectV2'
import { getChainInfo } from 'constants/chainInfo'
import { getChainPriority, L2_CHAIN_IDS } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { getSupportedChainIdsFromWalletConnectSession } from 'utils/getSupportedChainIdsFromWalletConnectSession'

import * as styles from './ChainSelector.css'
import ChainSelectorRow from './ChainSelectorRow'
import { NavDropdown } from './NavDropdown'

const Label = styled.div`
  grid-column: 2;
  grid-row: 1;
  font-size: 16px;
`

const NETWORK_SELECTOR_CHAINS = [...L2_CHAIN_IDS]

interface ChainSelectorProps {
  leftAlign?: boolean
}

function useWalletSupportedChains(): ChainId[] {
  const { connector } = useWeb3React()
  const getConnection = useGetConnection()
  const connectionType = getConnection(connector)?.type

  switch (connectionType) {
    case ConnectionType.WALLET_CONNECT_V2:
      return getSupportedChainIdsFromWalletConnectSession((connector as WalletConnectV2).provider?.session)
    default:
      return NETWORK_SELECTOR_CHAINS
  }
}

export const ChainSelector = ({ leftAlign }: ChainSelectorProps) => {
  const { chainId, connector } = useWeb3React()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const isMobile = useIsMobile()

  const theme = useTheme()
  const walletSupportsChain = useWalletSupportedChains()

  const [supportedChains] = useMemo(() => {
    const { supported, unsupported } = NETWORK_SELECTOR_CHAINS.sort(
      (a, b) => getChainPriority(a) - getChainPriority(b)
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
  }, [walletSupportsChain])

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

  // const getConnection = useGetConnection()
  // const connectionType = getConnection(connector)?.type
  // const isUniWallet = connectionType === ConnectionType.UNIWALLET

  if (!chainId) {
    return null
  }

  const isSupported = !!info

  const dropdown = (
    <NavDropdown top="56" left={leftAlign ? '0' : 'auto'} right={leftAlign ? 'auto' : '0'} ref={modalRef}>
      <Column paddingX="8">
        {supportedChains.map((selectorChain) => (
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

  return (
    <Box position="relative" ref={ref}>
      <MouseoverTooltip text={t`Your wallet's current network is unsupported.`} disableHover={isSupported}>
        <Row
          as="button"
          gap="8"
          alignItems="center"
          className={styles.ChainSelector}
          background={isOpen ? 'accentActiveSoft' : 'none'}
          onClick={() => setIsOpen(!isOpen)}
        >
          {!isSupported ? (
            <AlertTriangle size={20} color={theme.accentCritical} />
          ) : (
            <img src={info.logoUrl} alt={info.label} className={styles.Image} data-testid="chain-selector-logo" />
          )}
          {info?.label && <Label>{info?.label || ''}</Label>}
        </Row>
      </MouseoverTooltip>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </Box>
  )
}
