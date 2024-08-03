import Badge from 'components/Badge'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { AllNetworksIcon } from 'components/Tokens/TokenTable/icons'
import {
  BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS,
  BACKEND_SUPPORTED_CHAINS,
  useChainFromUrlParam,
  useIsSupportedChainIdCallback,
} from 'constants/chains'
import { getSupportedGraphQlChain, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { Trans } from 'i18n'
import styled, { css, useTheme } from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore'
import { useExploreParams } from 'pages/Explore/redirects'
import { useReducer } from 'react'
import { Check } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { EllipsisStyle } from 'theme/components'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  const isSupportedChainCallaback = useIsSupportedChainIdCallback()
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)

  const exploreParams = useExploreParams()
  const currentChain = getSupportedGraphQlChain(useChainFromUrlParam(), { fallbackToEthereum: true })
  const tab = exploreParams.tab

  return (
    <div>
      <DropdownSelector
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={
          <NetworkLabel>
            {!exploreParams.chainName && isMultichainExploreEnabled ? (
              <AllNetworksIcon />
            ) : (
              <ChainLogo chainId={currentChain.id} size={20} testId="tokens-network-filter-selected" />
            )}
          </NetworkLabel>
        }
        internalMenuItems={
          <>
            {isMultichainExploreEnabled && (
              <InternalMenuItem
                key="All networks"
                data-testid="tokens-network-filter-option-all-networks"
                onClick={() => {
                  navigate(`/explore/${tab ?? ExploreTab.Tokens}`)
                  toggleMenu()
                }}
              >
                <NetworkLabel>
                  <AllNetworksIcon /> <Trans>All networks</Trans>
                </NetworkLabel>
                {!exploreParams.chainName && <Check size={16} color={theme.accent1} />}
              </InternalMenuItem>
            )}
            {BACKEND_SUPPORTED_CHAINS.map((network) => {
              const chainId = supportedChainIdFromGQLChain(network)
              const isSupportedChain = isSupportedChainCallaback(chainId)
              const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[chainId] : undefined
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
                    <ChainLogo chainId={chainId} size={20} /> {chainInfo?.label}
                  </NetworkLabel>
                  {network === currentChain.backendChain.chain && exploreParams.chainName && (
                    <Check size={16} color={theme.accent1} />
                  )}
                </InternalMenuItem>
              )
            })}
            {BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.map((network) => {
              const isSupportedChain = isSupportedChainCallaback(network)
              const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[network] : undefined
              return chainInfo ? (
                <InternalMenuItem key={network} data-testid={`tokens-network-filter-option-${network}-chain`} disabled>
                  <NetworkLabel>
                    <ChainLogo chainId={network} size={20} /> {chainInfo.label}
                  </NetworkLabel>
                  <Tag>Coming soon</Tag>
                </InternalMenuItem>
              ) : null
            })}
          </>
        }
        buttonCss={StyledButton}
        menuFlyoutCss={StyledMenuFlyout}
      />
    </div>
  )
}
