import { useApolloClient } from '@apollo/client'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { GQLQueries, GraphQLApi } from '@universe/api'
import React, { memo, useEffect, useMemo } from 'react'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { useIsInModal } from 'src/components/modals/useIsInModal'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBridgedAssetSection } from 'src/components/TokenDetails/TokenDetailsBridgedAssetSection'
import { TokenDetailsContextProvider, useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import { TokenDetailsActionButtonsWrapper } from 'src/screens/TokenDetailsScreen/TokenDetailsActionButtonsWrapper'
import { HeaderRightElement, HeaderTitleElement } from 'src/screens/TokenDetailsScreen/TokenDetailsHeaders'
import { TokenDetailsModals } from 'src/screens/TokenDetailsScreen/TokenDetailsModals'
import { Flex, Separator } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { useDelayedRender } from 'utilities/src/react/useDelayedRender'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const CONTEXT_MENU_RENDER_DELAY_MS = 1000

export function TokenDetailsScreen({ route, navigation }: AppStackScreenProp<MobileScreens.TokenDetails>): JSX.Element {
  const { currencyId } = route.params
  const normalizedCurrencyId = normalizeAddress(currencyId, AddressStringFormat.Lowercase)

  return (
    <TokenDetailsContextProvider currencyId={normalizedCurrencyId} navigation={navigation}>
      <TokenDetailsWrapper />
    </TokenDetailsContextProvider>
  )
}

function TokenDetailsWrapper(): JSX.Element {
  const { chainId, address, currencyId } = useTokenDetailsContext()
  const { data: token } = useTokenBasicInfoPartsFragment({ currencyId })

  const traceProperties = useMemo(
    () => ({
      chain: chainId,
      address,
      currencyName: token.name,
    }),
    [address, chainId, token.name],
  )

  return (
    <ReactNavigationPerformanceView interactive screenName={MobileScreens.TokenDetails}>
      <Trace directFromPage logImpression properties={traceProperties} screen={MobileScreens.TokenDetails}>
        <TokenDetailsQuery />
      </Trace>
    </ReactNavigationPerformanceView>
  )
}

const TokenDetailsQuery = memo(function _TokenDetailsQuery(): JSX.Element {
  const { currencyId, setError } = useTokenDetailsContext()

  const { error } = GraphQLApi.useTokenDetailsScreenQuery({
    variables: currencyIdToContractInput(currencyId),
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  })

  useEffect(() => setError(error), [error, setError])

  return <TokenDetails />
})

const TokenDetails = memo(function _TokenDetails(): JSX.Element {
  const centerElement = useMemo(() => <HeaderTitleElement />, [])
  const rightElement = useMemo(() => <HeaderRightElement />, [])
  const { isContentHidden } = useDelayedRender(CONTEXT_MENU_RENDER_DELAY_MS)

  const inModal = useIsInModal(MobileScreens.Explore, true)

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
            <PriceExplorer />
          </Flex>

          <TokenDetailsErrorCard />

          <Flex gap="$spacing16" mb="$spacing8" px="$spacing16">
            <TokenWarningCardWrapper />

            <TokenBalancesWrapper />

            <TokenDetailsBridgedAssetSection />

            <Separator />
          </Flex>
          <Flex gap="$spacing24">
            <Flex px="$spacing16">
              <TokenDetailsStats />
            </Flex>
            <TokenDetailsLinks />
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      <TokenDetailsActionButtonsWrapper />

      <TokenDetailsModals />
    </>
  )
})

const TokenDetailsErrorCard = memo(function _TokenDetailsErrorCard(): JSX.Element | null {
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

const TokenBalancesWrapper = memo(function _TokenBalancesWrapper(): JSX.Element | null {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { currencyId, isChainEnabled } = useTokenDetailsContext()

  const projectTokens = useTokenBasicProjectPartsFragment({ currencyId }).data.project?.tokens

  const crossChainTokens: Array<{
    address: string | null
    chain: GraphQLApi.Chain
  }> = []

  for (const token of projectTokens ?? []) {
    if (!token || !token.chain || token.address === undefined) {
      continue
    }

    crossChainTokens.push({
      address: token.address,
      chain: token.chain,
    })
  }

  const { currentChainBalance, otherChainBalances } = useCrossChainBalances({
    evmAddress: activeAddress,
    currencyId,
    crossChainTokens,
  })

  return isChainEnabled ? (
    <TokenBalances currentChainBalance={currentChainBalance} otherChainBalances={otherChainBalances} />
  ) : null
})

const TokenWarningCardWrapper = memo(function _TokenWarningCardWrapper(): JSX.Element | null {
  const { currencyInfo, openTokenWarningModal } = useTokenDetailsContext()

  return <TokenWarningCard currencyInfo={currencyInfo} onPress={openTokenWarningModal} />
})
