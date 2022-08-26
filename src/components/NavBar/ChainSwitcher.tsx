import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { CheckMarkIcon, NewChevronDownIcon, NewChevronUpIcon, TokenWarningRedIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars, vars } from 'nft/css/sprinkles.css'
import { useIsMobile } from 'nft/hooks'
import { ReactNode, useReducer, useRef } from 'react'

import * as styles from './ChainSwitcher.css'
import { NavDropdown } from './NavDropdown'

const ChainRow = ({
  targetChain,
  onSelectChain,
}: {
  targetChain: SupportedChainId
  onSelectChain: (targetChain: number) => void
}) => {
  const { chainId } = useWeb3React()
  const active = chainId === targetChain
  const { label, logoUrl } = getChainInfo(targetChain)

  return (
    <Column borderRadius="12">
      <Row
        as="button"
        background="none"
        className={`${styles.ChainSwitcherRow} ${subhead}`}
        onClick={() => onSelectChain(targetChain)}
      >
        <ChainDetails>
          <img src={logoUrl} alt={label} className={styles.Icon} />
          {label}
        </ChainDetails>
        {active && <CheckMarkIcon width={20} height={20} color={vars.color.blue400} />}
      </Row>
    </Column>
  )
}

const ChainDetails = ({ children }: { children: ReactNode }) => <Row>{children}</Row>

const NETWORK_SELECTOR_CHAINS = [
  SupportedChainId.MAINNET,
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.CELO,
]

interface ChainSwitcherProps {
  leftAlign?: boolean
}

export const ChainSwitcher = ({ leftAlign }: ChainSwitcherProps) => {
  const { chainId } = useWeb3React()
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const isMobile = useIsMobile()

  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined, [modalRef])

  const info = chainId ? getChainInfo(chainId) : undefined

  const selectChain = useSelectChain()
  useSyncChainQuery()

  if (!chainId) {
    return null
  }

  const isSupported = !!info

  const dropdown = (
    <NavDropdown top="56" left={leftAlign ? '0' : 'auto'} right={leftAlign ? 'auto' : '0'} ref={modalRef}>
      <Column marginX="8">
        {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) => (
          <ChainRow
            onSelectChain={async (targetChainId: SupportedChainId) => {
              await selectChain(targetChainId)
              toggleOpen()
            }}
            targetChain={chainId}
            key={chainId}
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
        className={styles.ChainSwitcher}
        background={isOpen ? 'accentActiveSoft' : 'none'}
        onClick={toggleOpen}
      >
        {!isSupported ? (
          <>
            <TokenWarningRedIcon fill={themeVars.colors.darkGray} width={24} height={24} />
            <Box as="span" className={subhead} display={{ sm: 'none', xl: 'flex' }} style={{ lineHeight: '20px' }}>
              Unsupported
            </Box>
          </>
        ) : (
          <>
            <img src={info.logoUrl} alt={info.label} className={styles.Image} />
            <Box as="span" className={subhead} display={{ sm: 'none', xl: 'flex' }} style={{ lineHeight: '20px' }}>
              {info.label}
            </Box>
          </>
        )}
        {isOpen ? (
          <NewChevronUpIcon width={16} height={16} color="blackBlue" />
        ) : (
          <NewChevronDownIcon width={16} height={16} color="blackBlue" />
        )}
      </Row>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </Box>
  )
}
