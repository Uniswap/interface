import { InterfaceEventName, InterfacePageName } from '@uniswap/analytics-events'
import Badge from 'components/Badge/Badge'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { AllNetworksIcon } from 'components/Tokens/TokenTable/icons'
import deprecatedStyled, { useTheme } from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore'
import { useExploreParams } from 'pages/Explore/redirects'
import { Dispatch, SetStateAction, memo, useCallback, useState } from 'react'
import { Check } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { EllipsisTamaguiStyle } from 'theme/components'
import { Flex, FlexProps, ScrollView, Text, styled } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains, useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks'
import { ALL_CHAIN_IDS, GqlChainId, UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId, isTestnetChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'
import { useChainIdFromUrlParam } from 'utils/chainParams'

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
  const { isTestnetModeEnabled } = useEnabledChains()

  const exploreParams = useExploreParams()
  const currentChainId = useChainIdFromUrlParam()
  const tab = exploreParams.tab

  const tableNetworkItemRenderer = useCallback(
    (chainId: UniverseChainId) => {
      if (!isSupportedChainCallback(chainId)) {
        return null
      }
      const chainInfo = getChainInfo(chainId)
      const supported = isBackendSupportedChainId(chainId)
      return (
        <TableNetworkItem
          key={chainId}
          display={toGraphQLChain(chainId)}
          chainInfo={chainInfo}
          toggleMenu={toggleMenu}
          tab={tab}
          unsupported={!supported}
        />
      )
    },
    [isSupportedChainCallback, tab],
  )

  return (
    <div>
      <Trace modal={ModalName.NetworkSelector}>
        <DropdownSelector
          isOpen={isMenuOpen}
          toggleOpen={toggleMenu}
          menuLabel={
            <NetworkLabel>
              {!currentChainId ? (
                <AllNetworksIcon />
              ) : (
                <ChainLogo chainId={currentChainId} size={20} testId="tokens-network-filter-selected" />
              )}
            </NetworkLabel>
          }
          internalMenuItems={
            <ScrollView px="$spacing8">
              <TableNetworkItem display="All networks" toggleMenu={toggleMenu} tab={tab} />
              {/* non-testnet backend supported chains */}
              {ALL_CHAIN_IDS.filter(isBackendSupportedChainId)
                .filter((c) => !isTestnetChain(c))
                .map(tableNetworkItemRenderer)}
              {/* Testnet backend supported chains */}
              {isTestnetModeEnabled
                ? ALL_CHAIN_IDS.filter(isBackendSupportedChainId).filter(isTestnetChain).map(tableNetworkItemRenderer)
                : null}
              {/* Unsupported non-testnet backend supported chains */}
              {ALL_CHAIN_IDS.filter((c) => !isBackendSupportedChainId(c) && !isTestnetChain(c)).map(
                tableNetworkItemRenderer,
              )}
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
  display: 'All networks' | GqlChainId
  chainInfo?: UniverseChainInfo
  toggleMenu: Dispatch<SetStateAction<boolean>>
  tab?: ExploreTab
  unsupported?: boolean
}) {
  const navigate = useNavigate()
  const theme = useTheme()
  const { t } = useTranslation()
  const chainId = chainInfo?.id
  const exploreParams = useExploreParams()
  const urlChainId = useChainIdFromUrlParam()
  const currentChainInfo = urlChainId ? getChainInfo(urlChainId) : undefined

  const isAllNetworks = display === 'All networks'
  const isCurrentChain = isAllNetworks
    ? !currentChainInfo
    : currentChainInfo?.backendChain.chain === display && exploreParams.chainName
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
