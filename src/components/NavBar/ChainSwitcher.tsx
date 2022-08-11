/* eslint-disable react-hooks/exhaustive-deps */
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection/utils'
import { getChainInfo } from 'constants/chainInfo'
import { CHAIN_IDS_TO_NAMES, SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import usePrevious from 'hooks/usePrevious'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { NewChevronDownIcon, NewChevronUpIcon } from 'nft/components/icons'
import { CheckMarkIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useReducer, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { addPopup } from 'state/application/reducer'
import { updateConnectionError } from 'state/connection/reducer'
import { useAppDispatch } from 'state/hooks'
import { replaceURLParam } from 'utils/routes'
import { isChainAllowed, switchChain } from 'utils/switchChain'

import * as styles from './ChainSwitcher.css'
import { NavDropdown } from './NavDropdown'

const ChainRow = ({
  targetChain,
  onSelectChain,
}: {
  targetChain: SupportedChainId
  onSelectChain: (targetChain: number) => void
}) => {
  const { provider, chainId } = useWeb3React()
  if (!provider || !chainId) {
    return null
  }
  const active = chainId === targetChain
  const { label, logoUrl } = getChainInfo(targetChain)

  return (
    <Row
      as="button"
      background={active ? 'lightGrayContainer' : 'none'}
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

const getParsedChainId = (parsedQs?: ParsedQs) => {
  const chain = parsedQs?.chain
  if (!chain || typeof chain !== 'string') return { urlChain: undefined, urlChainId: undefined }

  return { urlChain: chain.toLowerCase(), urlChainId: getChainIdFromName(chain) }
}

const getChainIdFromName = (name: string) => {
  const entry = Object.entries(CHAIN_IDS_TO_NAMES).find(([_, n]) => n === name)
  const chainId = entry?.[0]
  return chainId ? parseInt(chainId) : undefined
}

const getChainNameFromId = (id: string | number) => {
  // casting here may not be right but fine to return undefined if it's not a supported chain ID
  return CHAIN_IDS_TO_NAMES[id as SupportedChainId] || ''
}

const NETWORK_SELECTOR_CHAINS = [
  SupportedChainId.MAINNET,
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
  SupportedChainId.ARBITRUM_ONE,
]

interface ChainSwitcherProps {
  isMobile?: boolean
}

export const ChainSwitcher = ({ isMobile }: ChainSwitcherProps) => {
  const dispatch = useAppDispatch()
  const { chainId, provider, connector } = useWeb3React()
  const previousChainId = usePrevious(chainId)
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const parsedQs = useParsedQueryString()
  const { urlChain, urlChainId } = getParsedChainId(parsedQs)
  const previousUrlChainId = usePrevious(urlChainId)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)

  const navigate = useNavigate()
  const location = useLocation()
  const info = chainId ? getChainInfo(chainId) : undefined

  const onSelectChain = useCallback(
    async (targetChain: number, skipToggle?: boolean) => {
      if (!connector) return

      const connectionType = getConnection(connector).type

      try {
        dispatch(updateConnectionError({ connectionType, error: undefined }))
        await switchChain(connector, targetChain)
      } catch (error) {
        console.error('Failed to switch networks', error)
        dispatch(updateConnectionError({ connectionType, error: error.message }))
        dispatch(addPopup({ content: { failedSwitchNetwork: targetChain }, key: `failed-network-switch` }))
      }

      if (!skipToggle) {
        toggleOpen()
      }
    },
    [connector, toggleOpen, dispatch]
  )

  useEffect(() => {
    if (!chainId || !previousChainId) return

    // when network change originates from wallet or dropdown selector, just update URL
    if (chainId !== previousChainId && chainId !== urlChainId) {
      navigate({ search: replaceURLParam(location.search, 'chain', getChainNameFromId(chainId)) }, { replace: true })
      // otherwise assume network change originates from URL
    } else if (urlChainId && urlChainId !== previousUrlChainId && urlChainId !== chainId) {
      onSelectChain(urlChainId, true).catch(() => {
        // we want app network <-> chainId param to be in sync, so if user changes the network by changing the URL
        // but the request fails, revert the URL back to current chainId
        navigate({ search: replaceURLParam(location.search, 'chain', getChainNameFromId(chainId)) }, { replace: true })
      })
    }
  }, [chainId, urlChainId, previousChainId, previousUrlChainId, onSelectChain, location])

  // set chain parameter on initial load if not there
  useEffect(() => {
    if (chainId && !urlChainId) {
      navigate({ search: replaceURLParam(location.search, 'chain', getChainNameFromId(chainId)) }, { replace: true })
    }
  }, [chainId, location, urlChainId, urlChain])

  if (!chainId || !info || !provider) {
    return null
  }

  return (
    <Box position="relative" ref={ref}>
      <Row as="button" gap="8" className={styles.ChainSwitcher} onClick={toggleOpen}>
        <img src={info.logoUrl} alt={info.label} className={styles.Image} />
        <Box as="span" fontWeight="semibold" color="explicitWhite" fontSize="16" style={{ lineHeight: '20px' }}>
          {info.label}
        </Box>
        {isOpen ? (
          <NewChevronUpIcon width={16} height={16} color="darkGray" />
        ) : (
          <NewChevronDownIcon width={16} height={16} color="darkGray" />
        )}
      </Row>
      {isOpen && (
        <NavDropdown top={60} leftAligned={isMobile}>
          <Column gap="4">
            {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) =>
              isChainAllowed(connector, chainId) ? (
                <ChainRow onSelectChain={onSelectChain} targetChain={chainId} key={chainId} />
              ) : null
            )}
          </Column>
        </NavDropdown>
      )}
    </Box>
  )
}
