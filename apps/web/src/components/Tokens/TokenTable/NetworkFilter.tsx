import { InterfaceEventName, InterfacePageName } from '@uniswap/analytics-events'
import Badge from 'components/Badge/Badge'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { AllNetworksIcon } from 'components/Tokens/TokenTable/icons'
import {
  BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS,
  BACKEND_SUPPORTED_CHAINS,
  InterfaceGqlChain,
  useChainFromUrlParam,
  useIsSupportedChainIdCallback,
} from 'constants/chains'
import { getSupportedGraphQlChain, supportedChainIdFromGQLChain } from 'graphql/data/util'
import deprecatedStyled, { useTheme } from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore'
import { useExploreParams } from 'pages/Explore/redirects'
import { Dispatch, SetStateAction, memo, useState } from 'react'
import { Check } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { EllipsisTamaguiStyle } from 'theme/components'
import { Flex, FlexProps, ScrollView, Text, styled } from 'ui/src'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId, UniverseChainInfo } from 'uniswap/src/types/chains'

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
  $lg: {
    left: 0,
    right: undefined,
  },
} satisfies FlexProps

export default function TableNetworkFilter() {
  const [isMenuOpen, toggleMenu] = useState(false)
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)

  const exploreParams = useExploreParams()
  const currentChain = getSupportedGraphQlChain(useChainFromUrlParam(), {
    fallbackToEthereum: !isMultichainExploreEnabled,
  })
  const tab = exploreParams.tab

  return (
    <div>
      <Trace modal={ModalName.NetworkSelector}>
        <DropdownSelector
          isOpen={isMenuOpen}
          toggleOpen={toggleMenu}
          menuLabel={
            <NetworkLabel>
              {!currentChain ? (
                <AllNetworksIcon />
              ) : (
                <ChainLogo chainId={currentChain.id} size={20} testId="tokens-network-filter-selected" />
              )}
            </NetworkLabel>
          }
          internalMenuItems={
            <ScrollView px="$spacing8">
              {isMultichainExploreEnabled && (
                <TableNetworkItem display="All networks" toggleMenu={toggleMenu} tab={tab} />
              )}
              {BACKEND_SUPPORTED_CHAINS.map((network) => {
                const chainId = supportedChainIdFromGQLChain(network)
                const isSupportedChain = isSupportedChainCallback(chainId)
                const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[chainId] : undefined
                return (
                  <TableNetworkItem
                    key={network}
                    display={network}
                    chainInfo={chainInfo}
                    toggleMenu={toggleMenu}
                    tab={tab}
                  />
                )
              })}
              {BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.map((network) => {
                const isSupportedChain = isSupportedChainCallback(network)
                const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[network] : undefined
                return chainInfo ? (
                  <TableNetworkItem
                    key={network}
                    display={chainInfo.backendChain.chain}
                    chainInfo={chainInfo}
                    toggleMenu={toggleMenu}
                    tab={tab}
                    unsupported
                  />
                ) : null
              })}
            </ScrollView>
          }
          buttonStyle={{ height: 40 }}
          dropdownStyle={StyledDropdown}
        />
      </Trace>
    </div>
  )
}

const TableNetworkItem = memo(function TableNetworkItem({
  display,
  chainInfo,
  toggleMenu,
  tab,
  unsupported,
}: {
  display: 'All networks' | InterfaceGqlChain
  chainInfo?: UniverseChainInfo
  toggleMenu: Dispatch<SetStateAction<boolean>>
  tab?: ExploreTab
  unsupported?: boolean
}) {
  const navigate = useNavigate()
  const theme = useTheme()
  const { t } = useTranslation()
  const isMultichainExploreEnabled = useFeatureFlag(FeatureFlags.MultichainExplore)
  const chainId = chainInfo?.id
  const exploreParams = useExploreParams()
  const currentChain = getSupportedGraphQlChain(
    useChainFromUrlParam(),
    isMultichainExploreEnabled ? undefined : { fallbackToEthereum: true },
  )
  const isAllNetworks = display === 'All networks' && isMultichainExploreEnabled
  const isCurrentChain = isAllNetworks
    ? !currentChain
    : currentChain?.backendChain.chain === display && exploreParams.chainName
  return (
    <Trace
      logPress
      eventOnTrigger={InterfaceEventName.CHAIN_CHANGED}
      properties={{ chain: display.toString(), page: InterfacePageName.EXPLORE_PAGE }}
    >
      <InternalMenuItem
        data-testid={`tokens-network-filter-option-${display.toLowerCase()}`}
        disabled={unsupported}
        onPress={() => {
          !unsupported &&
            navigate(`/explore/${tab ?? ExploreTab.Tokens}${!isAllNetworks ? `/${display.toLowerCase()}` : ''}`)
          toggleMenu(false)
        }}
      >
        <NetworkLabel>
          {isAllNetworks ? <AllNetworksIcon /> : <ChainLogo chainId={chainId ?? UniverseChainId.Mainnet} size={20} />}{' '}
          <Text variant="body2" {...EllipsisTamaguiStyle}>
            {!isAllNetworks ? chainInfo?.label : t('transaction.network.all')}
          </Text>
        </NetworkLabel>
        {unsupported ? (
          <Tag>{t('settings.setting.beta.tooltip')}</Tag>
        ) : isCurrentChain ? (
          <Check size={16} color={theme.accent1} />
        ) : null}
      </InternalMenuItem>
    </Trace>
  )
})
