import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { NewChevronDownIcon, NewChevronUpIcon } from 'nft/components/icons'
import { CheckMarkIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { ReactNode, useReducer, useRef } from 'react'
import { isChainAllowed } from 'utils/switchChain'

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
    <Row
      as="button"
      background={active ? 'lightGrayOverlay' : 'none'}
      className={`${styles.ChainSwitcherRow} ${subhead}`}
      onClick={() => onSelectChain(targetChain)}
    >
      <ChainDetails>
        <img src={logoUrl} alt={label} className={styles.Icon} />
        {label}
      </ChainDetails>
      {active && <CheckMarkIcon width={20} height={20} />}
    </Row>
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
  isMobile?: boolean
}

export const ChainSwitcher = ({ isMobile }: ChainSwitcherProps) => {
  const { chainId } = useWeb3React()
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)

  const info = chainId ? getChainInfo(chainId) : undefined

  const selectChain = useSelectChain()
  useSyncChainQuery()

  if (!chainId || !info) {
    return null
  }

  return (
    <Box position="relative" ref={ref}>
      <Row as="button" gap="8" className={styles.ChainSwitcher} onClick={toggleOpen}>
        <img src={info.logoUrl} alt={info.label} className={styles.Image} />
        <Box as="span" className={subhead} style={{ lineHeight: '20px' }}>
          {info.label}
        </Box>
        {isOpen ? (
          <NewChevronUpIcon width={16} height={16} color="blackBlue" />
        ) : (
          <NewChevronDownIcon width={16} height={16} color="blackBlue" />
        )}
      </Row>
      {isOpen && (
        <NavDropdown top={60} leftAligned={isMobile}>
          <Column gap="4">
            {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) =>
              isChainAllowed(chainId) ? (
                <ChainRow
                  onSelectChain={async (targetChainId: SupportedChainId) => {
                    await selectChain(targetChainId)
                    toggleOpen()
                  }}
                  targetChain={chainId}
                  key={chainId}
                />
              ) : null
            )}
          </Column>
        </NavDropdown>
      )}
    </Box>
  )
}
