import { useApolloClient } from '@apollo/client'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { GQLQueries, GraphQLApi } from '@universe/api'
import React, { memo, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { navigate } from 'src/app/navigation/rootNavigation'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { useIsInModal } from 'src/components/modals/useIsInModal'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { ContractAddressExplainerModal } from 'src/components/TokenDetails/ContractAddressExplainerModal'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { TokenDetailsBridgedAssetSection } from 'src/components/TokenDetails/TokenDetailsBridgedAssetSection'
import { TokenDetailsContextProvider, useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import { useTokenDetailsCTAVariant } from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { HeaderRightElement, HeaderTitleElement } from 'src/screens/TokenDetailsHeaders'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { Flex, Separator } from 'ui/src'
import { ArrowDownCircle, ArrowUpCircle, Bank, SendRoundedAirplane } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import type { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import type { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

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

  const inModal = useIsInModal(MobileScreens.Explore, true)

  return (
    <>
      <HeaderScrollScreen
        showHandleBar={inModal}
        renderedInModal={inModal}
        centerElement={centerElement}
        rightElement={rightElement}
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

  const onRetry = useCallback(() => {
    setError(undefined)
    apolloClient
      .refetchQueries({ include: [GQLQueries.TokenDetailsScreen, GQLQueries.TokenPriceHistory] })
      .catch((e) => setError(e))
  }, [apolloClient, setError])

  return error ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOutDown} px="$spacing24">
      <BaseCard.InlineErrorState onRetry={onRetry} />
    </AnimatedFlex>
  ) : null
})

const TokenDetailsModals = memo(function _TokenDetailsModals(): JSX.Element {
  const { navigateToSwapFlow } = useWalletNavigation()

  const {
    chainId,
    address,
    activeTransactionType,
    currencyInfo,
    isTokenWarningModalOpen,
    isContractAddressExplainerModalOpen,
    closeTokenWarningModal,
    closeContractAddressExplainerModal,
    copyAddressToClipboard,
  } = useTokenDetailsContext()

  const onCloseTokenWarning = useEvent(() => {
    closeTokenWarningModal()
  })

  const onAcknowledgeTokenWarning = useEvent(() => {
    closeTokenWarningModal()
    if (activeTransactionType !== undefined) {
      navigateToSwapFlow({ currencyField: activeTransactionType, currencyAddress: address, currencyChainId: chainId })
    }
  })

  const onAcknowledgeContractAddressExplainer = useEvent(async (markViewed: boolean) => {
    closeContractAddressExplainerModal(markViewed)
    if (markViewed) {
      await copyAddressToClipboard(address)
    }
  })

  return (
    <>
      {isTokenWarningModalOpen && currencyInfo && (
        <TokenWarningModal
          isInfoOnlyWarning
          currencyInfo0={currencyInfo}
          isVisible={isTokenWarningModalOpen}
          closeModalOnly={onCloseTokenWarning}
          onAcknowledge={onAcknowledgeTokenWarning}
        />
      )}

      {isContractAddressExplainerModalOpen && (
        <ContractAddressExplainerModal onAcknowledge={onAcknowledgeContractAddressExplainer} />
      )}
    </>
  )
})

const TokenDetailsActionButtonsWrapper = memo(function _TokenDetailsActionButtonsWrapper(): JSX.Element | null {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const activeAddress = useActiveAccountAddressWithThrow()
  const { isTestnetModeEnabled } = useEnabledChains()

  const { currencyId, chainId, address, currencyInfo, openTokenWarningModal, tokenColorLoading, navigation } =
    useTokenDetailsContext()

  const { navigateToFiatOnRamp, navigateToSwapFlow, navigateToSend, navigateToReceive } = useWalletNavigation()

  const token = useTokenBasicInfoPartsFragment({ currencyId }).data

  const isBlocked = currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const isNativeCurrency = isNativeCurrencyAddress(chainId, address)
  const nativeCurrencyAddress = getChainInfo(chainId).nativeCurrency.address

  const { balance: nativeCurrencyBalance, isLoading: isNativeCurrencyBalanceLoading } = useOnChainNativeCurrencyBalance(
    chainId,
    activeAddress,
  )
  const hasZeroNativeBalance = nativeCurrencyBalance && nativeCurrencyBalance.equalTo('0')

  const { currency: nativeFiatOnRampCurrency, isLoading: isNativeFiatOnRampCurrencyLoading } =
    useIsSupportedFiatOnRampCurrency(buildCurrencyId(chainId, nativeCurrencyAddress))

  const currentChainBalance = useTokenDetailsCurrentChainBalance()

  const hasTokenBalance = Boolean(currentChainBalance)

  const { currency: fiatOnRampCurrency, isLoading: isFiatOnRampCurrencyLoading } =
    useIsSupportedFiatOnRampCurrency(currencyId)

  const { data: bridgingTokenWithHighestBalance, isLoading: isBridgingTokenLoading } =
    useBridgingTokenWithHighestBalance({
      evmAddress: activeAddress,
      currencyAddress: address,
      currencyChainId: chainId,
    })

  const onPressSwap = useCallback(
    (currencyField: CurrencyField) => {
      if (isBlocked) {
        openTokenWarningModal()
      } else {
        navigateToSwapFlow({ currencyField, currencyAddress: address, currencyChainId: chainId })
      }
    },
    [isBlocked, openTokenWarningModal, navigateToSwapFlow, address, chainId],
  )

  const onPressBuyFiatOnRamp = useCallback(
    (isOfframp = false): void => {
      navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency, isOfframp })
    },
    [navigateToFiatOnRamp, fiatOnRampCurrency],
  )

  const onPressGet = useCallback(() => {
    navigate(ModalName.BuyNativeToken, {
      chainId,
      currencyId,
    })
  }, [chainId, currencyId])

  const onPressSend = useCallback(() => {
    navigateToSend({ currencyAddress: address, chainId })
  }, [address, chainId, navigateToSend])

  const onPressWithdraw = useCallback(() => {
    setTimeout(() => {
      navigate(ModalName.Wormhole, {
        currencyInfo,
      })
    }, 300) // delay is needed to prevent menu from not closing properly
  }, [currencyInfo])

  const bridgedWithdrawalInfo = currencyInfo?.bridgedWithdrawalInfo

  const isScreenNavigationReady = useIsScreenNavigationReady({ navigation })

  const getCTAVariant = useTokenDetailsCTAVariant({
    hasTokenBalance,
    isNativeCurrency,
    nativeFiatOnRampCurrency,
    fiatOnRampCurrency,
    bridgingTokenWithHighestBalance,
    hasZeroNativeBalance,
    tokenSymbol: token.symbol,
    onPressBuyFiatOnRamp,
    onPressGet,
    onPressSwap,
  })

  const actionMenuOptions: MenuOptionItem[] = useMemo(() => {
    const actions: MenuOptionItem[] = []

    if (fiatOnRampCurrency) {
      actions.push({ label: t('common.button.buy'), Icon: Bank, onPress: () => onPressBuyFiatOnRamp() })
    }

    if (bridgedWithdrawalInfo && hasTokenBalance) {
      actions.push({
        label: t('common.withdraw'),
        Icon: ArrowUpCircle,
        onPress: () => onPressWithdraw(),
        subheader: t('bridgedAsset.wormhole.toNativeChain', { nativeChainName: bridgedWithdrawalInfo.chain }),
        actionType: 'external-link',
        height: 56,
      })
    }

    if (hasTokenBalance && fiatOnRampCurrency) {
      actions.push({ label: t('common.button.sell'), Icon: ArrowUpCircle, onPress: () => onPressBuyFiatOnRamp(true) })
    }

    if (hasTokenBalance) {
      actions.push({ label: t('common.button.send'), Icon: SendRoundedAirplane, onPress: onPressSend })
    }

    // All cases have a receive action
    actions.push({ label: t('common.button.receive'), Icon: ArrowDownCircle, onPress: navigateToReceive })

    return actions
  }, [
    fiatOnRampCurrency,
    t,
    bridgedWithdrawalInfo,
    hasTokenBalance,
    onPressWithdraw,
    onPressSend,
    navigateToReceive,
    onPressBuyFiatOnRamp,
  ])

  const hideActionButtons =
    !isScreenNavigationReady ||
    tokenColorLoading ||
    isNativeCurrencyBalanceLoading ||
    isNativeFiatOnRampCurrencyLoading ||
    isFiatOnRampCurrencyLoading ||
    isBridgingTokenLoading

  return hideActionButtons ? null : (
    <AnimatedFlex mb={insets.bottom} backgroundColor="$surface1" entering={FadeInDown}>
      <TokenDetailsActionButtons
        ctaButton={getCTAVariant}
        actionMenuOptions={actionMenuOptions}
        userHasBalance={hasTokenBalance}
        onPressDisabled={
          isTestnetModeEnabled
            ? (): void =>
                navigate(ModalName.TestnetMode, {
                  unsupported: true,
                  descriptionCopy: t('tdp.noTestnetSupportDescription'),
                })
            : openTokenWarningModal
        }
      />
    </AnimatedFlex>
  )
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
