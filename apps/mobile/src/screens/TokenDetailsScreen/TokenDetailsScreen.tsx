import { useApolloClient } from '@apollo/client'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { GQLQueries, GraphQLApi } from '@universe/api'
import { FeatureFlags } from '@universe/gating'
import React, { memo, useEffect, useMemo } from 'react'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { useIsInModal } from 'src/components/modals/useIsInModal'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { MoreRwaTokens } from 'src/components/TokenDetails/rwa/MoreRwaTokens'
import { OffHoursMarketWarning } from 'src/components/TokenDetails/rwa/OffHoursMarketWarning'
import { OtherStocks } from 'src/components/TokenDetails/rwa/OtherStocks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBridgedAssetSection } from 'src/components/TokenDetails/TokenDetailsBridgedAssetSection'
import { TokenDetailsContextProvider, useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsEarnBanner } from 'src/components/TokenDetails/TokenDetailsEarnBanner'
import { TokenDetailsEarnSection } from 'src/components/TokenDetails/TokenDetailsEarnSection'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats/TokenDetailsStats'
import { TokenDetailsVaultShareBanner } from 'src/components/TokenDetails/TokenDetailsVaultShareBanner'
import { TokenPerformance } from 'src/components/TokenDetails/TokenPerformance'
import { useMobileTokenDetailsEarnData } from 'src/components/TokenDetails/useMobileTokenDetailsEarnData'
import { useMobileTokenDetailsVaultShareData } from 'src/components/TokenDetails/useMobileTokenDetailsVaultShareData'
import { useTokenDetailsCrossChainBalances } from 'src/components/TokenDetails/useTokenDetailsCrossChainBalances'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { TokenDetailsActionButtonsWrapper } from 'src/screens/TokenDetailsScreen/TokenDetailsActionButtonsWrapper'
import { HeaderRightElement, HeaderTitleElement } from 'src/screens/TokenDetailsScreen/TokenDetailsHeaders'
import { TokenDetailsModals } from 'src/screens/TokenDetailsScreen/TokenDetailsModals'
import { Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useLogRWATokenDetailsViewed } from 'uniswap/src/features/rwa/useLogRWATokenDetailsViewed'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { useEvent } from 'utilities/src/react/hooks'
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
  const { data: token } = useTokenBasicInfoPartsFragment({ currencyId })
  const { data: projectParts } = useTokenBasicProjectPartsFragment({ currencyId })
  // Combine the navigator-provided hint with the project-derived signal so the
  // first analytics impression carries the correct value even when the project
  // fragment hasn't resolved yet.
  const isMultichainAsset = initialIsMultichainAsset || isMultichainProjectTokens(projectParts.project?.tokens)

  const traceProperties = useMemo(
    () => ({
      chain: chainId,
      address,
      currencyName: token.name,
      multichain: isMultichainAsset,
    }),
    [address, chainId, isMultichainAsset, token.name],
  )

  const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdp)
  useLogRWATokenDetailsViewed({
    rwaMatch,
    tokenAddress: address,
    tokenSymbol: token.symbol,
    chainId,
  })

  return (
    <ReactNavigationPerformanceView interactive screenName={MobileScreens.TokenDetails}>
      <Trace directFromPage logImpression properties={traceProperties} screen={MobileScreens.TokenDetails}>
        <TokenDetailsQuery />
      </Trace>
    </ReactNavigationPerformanceView>
  )
}

const TokenDetailsQuery = memo(function TokenDetailsQueryInner(): JSX.Element {
  const { currencyId, setError } = useTokenDetailsContext()

  const { error } = GraphQLApi.useTokenDetailsScreenQuery({
    variables: {
      ...currencyIdToContractInput(currencyId),
      multichain: true,
    },
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  })

  useEffect(() => setError(error), [error, setError])

  return <TokenDetails />
})

const TokenDetails = memo(function TokenDetailsInner(): JSX.Element {
  const centerElement = useMemo(() => <HeaderTitleElement />, [])
  const rightElement = useMemo(() => <HeaderRightElement />, [])
  const { isContentHidden } = useDelayedRender(CONTEXT_MENU_RENDER_DELAY_MS)

  const inModal = useIsInModal(MobileScreens.Explore, true)

  const { enabled: showEarn, activeAddress, earnData } = useMobileTokenDetailsEarnData()
  const { enabled: showVaultShare, vaultShareData } = useMobileTokenDetailsVaultShareData()

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

          <TokenDetailsErrorCard />

          <Flex gap="$spacing16" mb="$spacing8" px="$spacing16">
            <TokenWarningCardWrapper />

            <TokenBalancesWrapper />

            <TokenDetailsBridgedAssetSection />

            {showEarn && <TokenDetailsEarnSection activeAddress={activeAddress} earnData={earnData} />}

            {showEarn && <TokenDetailsEarnBanner earnData={earnData} />}
          </Flex>
          <Flex gap="$spacing24">
            <TokenPerformance />
            <MoreRwaTokens />
            <Flex px="$spacing16">
              <TokenDetailsStats />
            </Flex>
            <TokenDetailsLinks />
            <OtherStocks />
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      <TokenDetailsActionButtonsWrapper />

      <TokenDetailsModals />
    </>
  )
})

const TokenDetailsErrorCard = memo(function TokenDetailsErrorCardInner(): JSX.Element | null {
  const apolloClient = useApolloClient()
  const { error, setError } = useTokenDetailsContext()

  const onRetry = useEvent(() => {
    setError(undefined)
    apolloClient
      .refetchQueries({ include: [GQLQueries.TokenDetailsScreen, GQLQueries.TokenPriceHistory] })
      .catch((e) => setError(e))
  })

  return error ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOutDown} px="$spacing24">
      <BaseCard.InlineErrorState onRetry={onRetry} />
    </AnimatedFlex>
  ) : null
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
