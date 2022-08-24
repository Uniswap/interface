import { useWeb3React } from '@web3-react/core'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import {
  ActiveNetworkIcon,
  NewChevronDownIcon,
  NewChevronUpIcon,
  NewTabIcon,
  TokenWarningRedIcon,
} from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { ReactNode, useReducer, useRef } from 'react'
import { isChainAllowed } from 'utils/switchChain'

import * as styles from './ChainSwitcher.css'
import { NavDropdown } from './NavDropdown'

const ChainRow = ({
  targetChain,
  onSelectChain,
  toggleOpen,
}: {
  targetChain: SupportedChainId
  onSelectChain: (targetChain: number) => void
  toggleOpen: () => void
}) => {
  const { chainId } = useWeb3React()
  const active = chainId === targetChain
  const { helpCenterUrl, explorer, bridge, label, logoUrl } = getChainInfo(targetChain)

  return (
    <Column background={active ? 'lightGrayOverlay' : 'none'} borderRadius="12">
      <Row
        as="button"
        background="none"
        className={`${styles.ChainSwitcherRow} ${subhead}`}
        onClick={() => (active ? toggleOpen() : onSelectChain(targetChain))}
      >
        <ChainDetails>
          <img src={logoUrl} alt={label} className={styles.Icon} />
          {label}
        </ChainDetails>
        {active && <ActiveNetworkIcon />}
      </Row>
      {active && (
        <Column gap="8" paddingBottom="16">
          <Box className={styles.Separator} />
          {bridge && <ChainLinkOut externalLink={bridge} label={`${label} bridge`} />}
          {explorer && <ChainLinkOut externalLink={explorer} label={`${label} scan`} />}
          {helpCenterUrl && <ChainLinkOut externalLink={helpCenterUrl} label={`Learn more`} />}
        </Column>
      )}
    </Column>
  )
}

const ChainDetails = ({ children }: { children: ReactNode }) => <Row>{children}</Row>

const ChainLinkOut = ({ externalLink, label }: { externalLink: string; label: string }) => (
  <Row as="a" href={externalLink} className={styles.ChainInfo} target={'_blank'} rel={'noopener noreferrer'}>
    <Box as="span">{label}</Box>
    <NewTabIcon />
  </Row>
)

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

  return (
    <Box position="relative" ref={ref}>
      <Row
        as="button"
        gap="8"
        className={styles.ChainSwitcher}
        background={isOpen ? 'accentActiveSoft' : 'none'}
        onClick={toggleOpen}
      >
        {!chainId || !info ? (
          <>
            <TokenWarningRedIcon fill={themeVars.colors.darkGray} width={24} height={24} />
            <Box as="span" className={subhead} style={{ lineHeight: '20px' }}>
              {info?.label ?? 'Unsupported'}
            </Box>
          </>
        ) : (
          <>
            <img src={info.logoUrl} alt={info.label} className={styles.Image} />
            <Box as="span" className={subhead} style={{ lineHeight: '20px' }}>
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
      {isOpen && (
        <NavDropdown top={60} leftAligned={isMobile} paddingBottom={16}>
          <Column marginX="8">
            {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) =>
              isChainAllowed(chainId) ? (
                <ChainRow
                  onSelectChain={async (targetChainId: SupportedChainId) => {
                    await selectChain(targetChainId)
                  }}
                  toggleOpen={toggleOpen}
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
