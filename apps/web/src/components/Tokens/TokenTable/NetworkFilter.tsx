import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { useTheme } from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore/constants'
import { useExploreParams } from 'pages/Explore/redirects'
import type { Dispatch, SetStateAction } from 'react'
import { memo, useCallback, useState } from 'react'
import { Check } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import type { FlexProps } from 'ui/src'
import { ElementAfterText, Flex, ScrollView, styled, useMedia } from 'ui/src'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import Badge from 'uniswap/src/components/badge/Badge'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useNewChainIds } from 'uniswap/src/features/chains/hooks/useNewChainIds'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import type { UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId, isTestnetChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { getChainUrlParam, useChainIdFromUrlParam } from 'utils/chainParams'

const NetworkLabel = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
})

const StyledDropdown = {
  maxHeight: 350,
  minWidth: 256,
  px: 0,
} satisfies FlexProps

export default function TableNetworkFilter({ showMultichainOption = true }: { showMultichainOption?: boolean }) {
  const [isMenuOpen, toggleMenu] = useState(false)
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { chains: enabledChainIds } = useEnabledChains({ includeTestnets: true })

  const exploreParams = useExploreParams()
  const currentChainId = useChainIdFromUrlParam()
  const tab = exploreParams.tab
  const media = useMedia()

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
    <Flex>
      <Trace modal={ModalName.NetworkSelector}>
        <DropdownSelector
          isOpen={isMenuOpen}
          toggleOpen={toggleMenu}
          menuLabel={
            <NetworkLabel>
              {(!currentChainId || !isSupportedChainCallback(currentChainId)) && showMultichainOption ? (
                <NetworkLogo chainId={null} />
              ) : (
                <ChainLogo
                  chainId={currentChainId ?? UniverseChainId.Mainnet}
                  size={20}
                  testId={TestID.TokensNetworkFilterSelected}
                />
              )}
            </NetworkLabel>
          }
          buttonStyle={{ height: 40 }}
          dropdownStyle={StyledDropdown}
          adaptToSheet
          allowFlip
          alignRight={!media.lg}
        >
          <ScrollView px="$spacing8">
            {showMultichainOption && <TableNetworkItem chainInfo={null} toggleMenu={toggleMenu} tab={tab} />}
            {/* non-testnet backend supported chains */}
            {enabledChainIds
              .filter(isBackendSupportedChainId)
              .filter((c) => !isTestnetChain(c))
              .map(tableNetworkItemRenderer)}
            {/* Testnet backend supported chains */}
            {isTestnetModeEnabled
              ? enabledChainIds
                  .filter(isBackendSupportedChainId)
                  .filter(isTestnetChain)
                  .filter((c) => c !== UniverseChainId.MonadTestnet)
                  .map(tableNetworkItemRenderer)
              : null}
            {/* Unsupported non-testnet backend supported chains */}
            {enabledChainIds
              .filter((c) => !isBackendSupportedChainId(c) && !isTestnetChain(c))
              .map(tableNetworkItemRenderer)}
          </ScrollView>
        </DropdownSelector>
      </Trace>
    </Flex>
  )
}

const TableNetworkItem = memo(function TableNetworkItem({
  chainInfo,
  toggleMenu,
  tab,
  unsupported,
}: {
  chainInfo: UniverseChainInfo | null
  toggleMenu: Dispatch<SetStateAction<boolean>>
  tab?: ExploreTab
  unsupported?: boolean
}) {
  const navigate = useNavigate()
  const theme = useTheme()
  const { t } = useTranslation()
  const exploreParams = useExploreParams()
  const urlChainId = useChainIdFromUrlParam()
  const currentChainInfo = urlChainId ? getChainInfo(urlChainId) : undefined
  const newChains = useNewChainIds()

  const isAllNetworks = chainInfo === null
  const chainId = isAllNetworks ? undefined : chainInfo.id
  const isNew = chainId && newChains.includes(chainId)

  const chainName = chainId ? toGraphQLChain(chainId) : 'All networks'
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''

  const isCurrentChain = isAllNetworks ? !currentChainInfo : currentChainInfo?.id === chainId && exploreParams.chainName

  return (
    <Trace
      logPress
      page={InterfacePageName.ExplorePage}
      properties={{
        tab,
        chain: chainName.toString(),
        previousConnectedChain: currentChainInfo?.id ? toGraphQLChain(currentChainInfo.id) : 'All networks',
      }}
    >
      <InternalMenuItem
        data-testid={`${TestID.TokensNetworkFilterOptionPrefix}${chainName.toLowerCase()}`}
        disabled={unsupported}
        onPress={() => {
          !unsupported && navigate(`/explore/${tab ?? ExploreTab.Tokens}${!isAllNetworks ? `/${chainUrlParam}` : ''}`)
          toggleMenu(false)
        }}
      >
        <NetworkLabel>
          {isAllNetworks ? (
            <NetworkLogo chainId={null} />
          ) : (
            <ChainLogo chainId={chainId ?? UniverseChainId.Mainnet} size={20} />
          )}
          <ElementAfterText
            text={isAllNetworks ? t('transaction.network.all') : chainInfo.label}
            textProps={{ variant: 'body2', ...EllipsisTamaguiStyle }}
            element={isNew && !unsupported ? <NewTag /> : undefined}
          />
        </NetworkLabel>
        {/* separate from ElementAfterText as this is placed at the far right of the row, not next to the text */}
        {unsupported ? (
          <Badge fontSize={10}>{t('settings.setting.beta.tooltip')}</Badge>
        ) : isCurrentChain ? (
          <Check size={16} color={theme.accent1} />
        ) : null}
      </InternalMenuItem>
    </Trace>
  )
})
