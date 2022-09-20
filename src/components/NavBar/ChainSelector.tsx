import { useWeb3React } from '@web3-react/core'
import { StyledChevronDown, StyledChevronUp } from 'components/Icons'
import Loader from 'components/Loader'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { CheckMarkIcon, TokenWarningRedIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars, vars } from 'nft/css/sprinkles.css'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useReducer, useRef, useState } from 'react'
import styled from 'styled-components/macro'

import * as styles from './ChainSelector.css'
import { NavDropdown } from './NavDropdown'

const StyledChainRow = styled.button`
  display: grid;
  background: none;
  grid-template-columns: 1fr 4fr 1fr;
  align-items: center;
  text-align: left;
`

const ChainLogo = styled.img`
  grid-column: 1;
  grid-row: 1;
`

const ChainLabel = styled.div`
  grid-column: 2;
  grid-row: 1;
`

const ChainStatus = styled.div`
  grid-column: 3;
  grid-row: 1;
`

const ApproveText = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 12px;
  grid-column: 2;
  grid-row: 2;
`

const ChainRow = ({
  targetChain,
  onSelectChain,
  isPending,
}: {
  targetChain: SupportedChainId
  onSelectChain: (targetChain: number) => void
  isPending: boolean
}) => {
  const { chainId } = useWeb3React()
  const active = chainId === targetChain
  const { label, logoUrl } = getChainInfo(targetChain)

  return (
    <StyledChainRow onClick={() => onSelectChain(targetChain)}>
      <ChainLogo src={logoUrl} alt={label} className={styles.Icon} />
      <ChainLabel>{label}</ChainLabel>
      {isPending && <ApproveText>Approve in wallet</ApproveText>}
      <ChainStatus>
        {active && <CheckMarkIcon width={20} height={20} color={vars.color.blue400} />}
        {isPending && <Loader />}
      </ChainStatus>
    </StyledChainRow>
  )
}

const NETWORK_SELECTOR_CHAINS = [
  SupportedChainId.MAINNET,
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.CELO,
]

interface ChainSelectorProps {
  leftAlign?: boolean
}

export const ChainSelector = ({ leftAlign }: ChainSelectorProps) => {
  const { chainId } = useWeb3React()
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const isMobile = useIsMobile()

  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined, [modalRef])

  const info = chainId ? getChainInfo(chainId) : undefined

  const selectChain = useSelectChain()
  useSyncChainQuery()

  const [pendingChainId, setPendingChainId] = useState<SupportedChainId | undefined>(undefined)

  const onSelectChain = useCallback(
    async (targetChainId: SupportedChainId) => {
      setPendingChainId(targetChainId)
      await selectChain(targetChainId)
      setPendingChainId(undefined)
      toggleOpen()
    },
    [selectChain]
  )

  if (!chainId) {
    return null
  }

  const isSupported = !!info

  const dropdown = (
    <NavDropdown top="56" left={leftAlign ? '0' : 'auto'} right={leftAlign ? 'auto' : '0'} ref={modalRef}>
      <Column marginX="8">
        {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) => (
          <ChainRow
            onSelectChain={onSelectChain}
            targetChain={chainId}
            key={chainId}
            isPending={chainId === pendingChainId}
          />
        ))}
      </Column>
    </NavDropdown>
  )

  return (
    <Box position="relative" ref={ref}>
      <Row
        as="button"
        gap="8"
        className={styles.ChainSelector}
        background={isOpen ? 'accentActiveSoft' : 'none'}
        onClick={toggleOpen}
      >
        {!isSupported ? (
          <>
            <TokenWarningRedIcon fill={themeVars.colors.darkGray} width={24} height={24} />
            <Box as="span" className={subhead} display={{ sm: 'none', xxl: 'flex' }} style={{ lineHeight: '20px' }}>
              Unsupported
            </Box>
          </>
        ) : (
          <>
            <img src={info.logoUrl} alt={info.label} className={styles.Image} />
            <Box as="span" className={subhead} display={{ sm: 'none', xxl: 'flex' }} style={{ lineHeight: '20px' }}>
              {info.label}
            </Box>
          </>
        )}
        {isOpen ? <StyledChevronUp /> : <StyledChevronDown />}
      </Row>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </Box>
  )
}
