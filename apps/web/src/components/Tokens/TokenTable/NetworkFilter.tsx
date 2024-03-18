import Badge from 'components/Badge'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { getChainInfo } from 'constants/chainInfo'
import {
  BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS,
  BACKEND_SUPPORTED_CHAINS,
  supportedChainIdFromGQLChain,
  validateUrlChainParam,
} from 'graphql/data/util'
import { ExploreTab } from 'pages/Explore'
import { useExploreParams } from 'pages/Explore/redirects'
import { useReducer } from 'react'
import { Check } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { EllipsisStyle } from 'theme/components'

const NetworkLabel = styled.div`
  ${EllipsisStyle}
  display: flex;
  gap: 8px;
  align-items: center;
`

const Tag = styled(Badge)`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  font-size: 10px;
  opacity: 1;
  padding: 4px 6px;
`
const StyledButton = css`
  height: 40px;
`
const StyledMenuFlyout = css`
  max-height: 350px;
  min-width: 240px;
  right: 0px;
  @media screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    left: 0px;
  }
`
export default function NetworkFilter() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [isMenuOpen, toggleMenu] = useReducer((s) => !s, false)

  const exploreParams = useExploreParams()
  const tab = exploreParams.tab
  const currentChainName = validateUrlChainParam(exploreParams.chainName)
  const chainId = supportedChainIdFromGQLChain(currentChainName)

  return (
    <div>
      <DropdownSelector
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={
          <NetworkLabel data-testid="tokens-network-filter-selected">
            <ChainLogo chainId={chainId} size={20} />
          </NetworkLabel>
        }
        internalMenuItems={
          <>
            {BACKEND_SUPPORTED_CHAINS.map((network) => {
              const chainId = supportedChainIdFromGQLChain(network)
              const chainInfo = getChainInfo(chainId)
              return (
                <InternalMenuItem
                  key={network}
                  data-testid={`tokens-network-filter-option-${network.toLowerCase()}`}
                  onClick={() => {
                    navigate(`/explore/${tab ?? ExploreTab.Tokens}/${network.toLowerCase()}`)
                    toggleMenu()
                  }}
                >
                  <NetworkLabel>
                    <ChainLogo chainId={chainId} size={20} /> {chainInfo.label}
                  </NetworkLabel>
                  {network === currentChainName && <Check size={16} color={theme.accent1} />}
                </InternalMenuItem>
              )
            })}
            {BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.map((network) => {
              const chainInfo = getChainInfo(network)
              return (
                <InternalMenuItem key={network} data-testid={`tokens-network-filter-option-${network}-chain`} disabled>
                  <NetworkLabel>
                    <ChainLogo chainId={network} size={20} /> {chainInfo.label}
                  </NetworkLabel>
                  <Tag>Coming soon</Tag>
                </InternalMenuItem>
              )
            })}
          </>
        }
        buttonCss={StyledButton}
        menuFlyoutCss={StyledMenuFlyout}
      />
    </div>
  )
}
