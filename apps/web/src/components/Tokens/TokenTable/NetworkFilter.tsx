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
import deprecatedStyled, { useTheme } from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore'
import { useExploreParams } from 'pages/Explore/redirects'
import { useState } from 'react'
import { Check } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { TamaguiEllipsisStyle } from 'theme/components'
import { Flex, FlexProps, ScrollView, Text, styled } from 'ui/src'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'

const NetworkLabel = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
})

const Tag = deprecatedStyled(Badge)`
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  font-size: 10px;
  opacity: 1;
  padding: 4px 6px;
`
const StyledDropdown = {
  maxHeight: 350,
  minWidth: 256,
  right: 0,
  px: 0,
  $xl: {
    left: 0,
    right: undefined,
  },
} satisfies FlexProps

export default function TableNetworkFilter() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()
  const [isMenuOpen, toggleMenu] = useState(false)
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
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
          <ScrollView px="$spacing8">
            {isMultichainExploreEnabled && (
              <InternalMenuItem
                key="All networks"
                data-testid="tokens-network-filter-option-all-networks"
                onPress={() => {
                  navigate(`/explore/${tab ?? ExploreTab.Tokens}`)
                  toggleMenu(false)
                }}
              >
                <NetworkLabel>
                  <AllNetworksIcon />{' '}
                  <Text variant="body2" {...TamaguiEllipsisStyle}>
                    {t('transaction.network.all')}
                  </Text>
                </NetworkLabel>
                {!exploreParams.chainName && <Check size={16} color={theme.accent1} />}
              </InternalMenuItem>
            )}
            {BACKEND_SUPPORTED_CHAINS.map((network) => {
              const chainId = supportedChainIdFromGQLChain(network)
              const isSupportedChain = isSupportedChainCallback(chainId)
              const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[chainId] : undefined
              return (
                <InternalMenuItem
                  key={network}
                  data-testid={`tokens-network-filter-option-${network.toLowerCase()}`}
                  onPress={() => {
                    navigate(`/explore/${tab ?? ExploreTab.Tokens}/${network.toLowerCase()}`)
                    toggleMenu(false)
                  }}
                >
                  <NetworkLabel>
                    <ChainLogo chainId={chainId} size={20} />{' '}
                    <Text variant="body2" {...TamaguiEllipsisStyle}>
                      {chainInfo?.label}
                    </Text>
                  </NetworkLabel>
                  {network === currentChain.backendChain.chain && exploreParams.chainName && (
                    <Check size={16} color={theme.accent1} />
                  )}
                </InternalMenuItem>
              )
            })}
            {BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.map((network) => {
              const isSupportedChain = isSupportedChainCallback(network)
              const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[network] : undefined
              return chainInfo ? (
                <InternalMenuItem key={network} data-testid={`tokens-network-filter-option-${network}-chain`} disabled>
                  <NetworkLabel>
                    <ChainLogo chainId={network} size={20} />{' '}
                    <Text variant="body2" {...TamaguiEllipsisStyle}>
                      {chainInfo.label}
                    </Text>
                  </NetworkLabel>
                  <Tag>Coming soon</Tag>
                </InternalMenuItem>
              ) : null
            })}
          </ScrollView>
        }
        buttonStyle={{ height: 40 }}
        dropdownStyle={StyledDropdown}
      />
    </div>
  )
}
