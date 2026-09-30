import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { useIsInModal } from 'src/components/modals/useIsInModal'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { RelatedTokens } from 'src/components/TokenDetails/relatedTokens/RelatedTokens'
import { MoreRwaTokens } from 'src/components/TokenDetails/rwa/MoreRwaTokens'
import { OffHoursMarketWarning } from 'src/components/TokenDetails/rwa/OffHoursMarketWarning'
import { OtherStocks } from 'src/components/TokenDetails/rwa/OtherStocks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBridgedAssetSection } from 'src/components/TokenDetails/TokenDetailsBridgedAssetSection'
import { TokenDetailsCollections } from 'src/components/TokenDetails/TokenDetailsCollections'
import { TokenDetailsContextProvider, useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsEarnBanner } from 'src/components/TokenDetails/TokenDetailsEarnBanner'
import { TokenDetailsEarnSection } from 'src/components/TokenDetails/TokenDetailsEarnSection'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsAbout } from 'src/components/TokenDetails/TokenDetailsStats/TokenDetailsAbout'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats/TokenDetailsStats'
import { TokenDetailsVaultShareBanner } from 'src/components/TokenDetails/TokenDetailsVaultShareBanner'
import { TokenPerformance } from 'src/components/TokenDetails/TokenPerformance'
import { useMobileTokenDetailsEarnData } from 'src/components/TokenDetails/useMobileTokenDetailsEarnData'
import { useMobileTokenDetailsVaultShareData } from 'src/components/TokenDetails/useMobileTokenDetailsVaultShareData'
import { useTokenDetailsCrossChainBalances } from 'src/components/TokenDetails/useTokenDetailsCrossChainBalances'
import { useTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { TokenDetailsActionButtonsWrapper } from 'src/screens/TokenDetailsScreen/TokenDetailsActionButtonsWrapper'
import { HeaderRightElement, HeaderTitleElement } from 'src/screens/TokenDetailsScreen/TokenDetailsHeaders'
import { TokenDetailsModals } from 'src/screens/TokenDetailsScreen/TokenDetailsModals'
import { useMobileTDPHeartbeatCoordinator } from 'src/screens/TokenDetailsScreen/useMobileTDPHeartbeatCoordinator'
import { Lock } from 'ui/src/components/icons/Lock'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { PermissionedTokenInfoBottomSheet } from 'uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet'
import { useLogRWATokenDetailsViewed } from 'uniswap/src/features/rwa/useLogRWATokenDetailsViewed'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useDelayedRender } from 'utilities/src/react/useDelayedRender'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const CONTEXT_MENU_RENDER_DELAY_MS = 1000

export function TokenDetailsScreen({ route, navigation }: AppStackScreenProp<MobileScreens.TokenDetails>): JSX.Element {
  const { currencyId, isMultichainAsset } = route.params
  const normalizedCurrencyId = normalizeAddress(currencyId, AddressStringFormat.Lowercase)

  return (
    <TokenDetailsContextProvider
      currencyId={normalizedCurrencyId}
      navigation={navigation}
      initialIsMultichainAsset={isMultichainAsset}
    >
      <TokenDetailsWrapper />
    </TokenDetailsContextProvider>
  )
}

function TokenDetailsWrapper(): JSX.Element {
  const { chainId, address, currencyId, initialIsMultichainAsset } = useTokenDetailsContext()
  const metadata = useTokenMetadata(currencyId)

  const traceProperties = useMemo(
    () => ({
      chain: chainId,
      address,
      currencyName: metadata.name,
      multichain: initialIsMultichainAsset,
    }),
    [address, chainId, initialIsMultichainAsset, metadata.name],
  )

  const rwaMatch = useTokenDetailsRWAMatch()
  useLogRWATokenDetailsViewed({
    rwaMatch,
    tokenAddress: address,
    tokenSymbol: metadata.symbol,
    chainId,
  })

  // The TDP heartbeat coordinator owns refreshing this screen's queries — none poll on their own.
  // Balances (GetPortfolio, Zerion-backed) are intentionally off the tick; transaction sagas refetch them on change.
  useMobileTDPHeartbeatCoordinator(Boolean(rwaMatch))

  return (
    <ReactNavigationPerformanceView interactive screenName={MobileScreens.TokenDetails}>
      <Trace directFromPage logImpression properties={traceProperties} screen={MobileScreens.TokenDetails}>
        <TokenDetails />
      </Trace>
    </ReactNavigationPerformanceView>
  )
}

const TokenDetails = memo(function TokenDetailsInner(): JSX.Element {
  const centerElement = useMemo(() => <HeaderTitleElement />, [])
  const rightElement = useMemo(() => <HeaderRightElement />, [])
  const { isContentHidden } = useDelayedRender(CONTEXT_MENU_RENDER_DELAY_MS)

  const inModal = useIsInModal(MobileScreens.Explore, true)
  const { currencyId } = useTokenDetailsContext()

  const { enabled: showEarn, activeAddress, earnData } = useMobileTokenDetailsEarnData()
  const { enabled: showVaultShare, vaultShareData } = useMobileTokenDetailsVaultShareData()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const { categories, isLoading: isCategoriesLoading } = useTokenCategories(currencyId)
  // Tags aren't served for RWA tokens yet, so an untagged stock keeps its shelf in place instead of
  // losing both sections. OtherStocks goes at flag cleanup.
  const showOtherStocks = !tokenCategoriesEnabled || (!isCategoriesLoading && categories.length === 0)

  return (
    <>
      <HeaderScrollScreen
        showHandleBar={inModal}
        renderedInModal={inModal}
        centerElement={centerElement}
        // Delay rendering to avoid mounting context menu to the previous screen
        rightElement={isContentHidden ? undefined : rightElement}
      >
        <Flex gap="$spacing16" pb="$spacing16">
          <Flex gap="$spacing16">
            <TokenDetailsHeader />
            {showVaultShare && <TokenDetailsVaultShareBanner vaultShareData={vaultShareData} />}
            <PriceExplorer />
            <OffHoursMarketWarning />
          </Flex>

          <Flex gap="$spacing16" mb="$spacing8" px="$spacing16">
            <TokenWarningCardWrapper />

            <TokenBalancesWrapper />

            <TokenDetailsBridgedAssetSection />

            {showEarn && <TokenDetailsEarnSection activeAddress={activeAddress} earnData={earnData} />}

            {showEarn && <TokenDetailsEarnBanner activeAddress={activeAddress} earnData={earnData} />}
          </Flex>
          {tokenCategoriesEnabled && <TokenDetailsCollections />}
          <Flex gap="$spacing24">
            <TokenPerformance />
            <Flex gap="$spacing16">
              <PermissionedPillRow />
              <Flex gap="$spacing24">
                <TokenDetailsAbout />
                {tokenCategoriesEnabled && <RelatedTokens />}
                <TokenDetailsStats />
              </Flex>
            </Flex>
            <TokenDetailsLinks />
            <MoreRwaTokens />
            {showOtherStocks && <OtherStocks />}
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      <TokenDetailsActionButtonsWrapper />

      <TokenDetailsModals />
    </>
  )
})

const TokenBalancesWrapper = memo(function TokenBalancesWrapperInner(): JSX.Element | null {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { isChainEnabled } = useTokenDetailsContext()

  const {
    currentChainBalance,
    otherChainBalances,
    error: balanceError,
    dataUpdatedAt,
  } = useTokenDetailsCrossChainBalances({ evmAddress: activeAddress })

  return isChainEnabled ? (
    <TokenBalances
      currentChainBalance={currentChainBalance}
      otherChainBalances={otherChainBalances}
      isOutage={!!balanceError}
      dataUpdatedAt={dataUpdatedAt}
    />
  ) : null
})

const TokenWarningCardWrapper = memo(function TokenWarningCardWrapperInner(): JSX.Element | null {
  const { currencyInfo, openTokenWarningModal } = useTokenDetailsContext()

  return <TokenWarningCard currencyInfo={currencyInfo} onPress={openTokenWarningModal} />
})

// Allowlisted-only "Permissioned" pill, shown as its own row just above the stats section.
// Figma places it in the About section, but not every token has one, so it lives as an
// independent piece of UI here. Mirrors the web TDP `isVerified` predicate
// (isPermissioned && isAllowlisted); never shown to a non-allowlisted wallet.
const PermissionedPillRow = memo(function PermissionedPillRowInner(): JSX.Element | null {
  const { t } = useTranslation()
  const { currencyInfo, isPermissioned, isAllowlisted, permissionedIssuer } = useTokenDetailsContext()
  const { value: isInfoOpen, setTrue: openInfo, setFalse: closeInfo } = useBooleanState(false)
  const tokenSymbol = currencyInfo?.currency.symbol ?? ''

  if (!isPermissioned || !isAllowlisted) {
    return null
  }

  return (
    <Flex row px="$spacing16">
      <TouchableArea onPress={openInfo}>
        <Flex
          row
          alignItems="center"
          gap="$spacing4"
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          px="$spacing12"
          py="$spacing6"
        >
          <Lock size="$icon.16" color="$neutral2" />
          <Text variant="buttonLabel3" color="$neutral1">
            {permissionedIssuer
              ? t('permissionedPool.tooltip.lockIcon.verifiedSuffix', { issuer: permissionedIssuer })
              : t('permissionedPool.tdp.permissioned')}
          </Text>
        </Flex>
      </TouchableArea>
      <PermissionedTokenInfoBottomSheet isOpen={isInfoOpen} tokenSymbol={tokenSymbol} onClose={closeInfo} />
    </Flex>
  )
})
