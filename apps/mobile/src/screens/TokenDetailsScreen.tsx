import { useApolloClient } from '@apollo/client'
import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { StyledContextMenuAction } from 'src/components/ContextMenu/StyledContextMenu'
import { PriceExplorer } from 'src/components/PriceExplorer/PriceExplorer'
import { BuyNativeTokenModal } from 'src/components/TokenDetails/BuyNativeTokenModal'
import { ContractAddressExplainerModal } from 'src/components/TokenDetails/ContractAddressExplainerModal'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsActionButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { TokenDetailsContextProvider, useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { TokenDetailsHeader } from 'src/components/TokenDetails/TokenDetailsHeader'
import { TokenDetailsLinks } from 'src/components/TokenDetails/TokenDetailsLinks'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import { useTokenDetailsCTAVariant } from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { HeaderRightElement, HeaderTitleElement } from 'src/screens/TokenDetailsHeaders'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { Flex, Separator } from 'ui/src'
import { ArrowDownCircle, ArrowUpCircle, Bank, SendRoundedAirplane } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import {
  Chain,
  useTokenDetailsScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  useTokenBasicInfoPartsFragment,
  useTokenBasicProjectPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { CurrencyField } from 'uniswap/src/types/currency'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function TokenDetailsScreen({ route, navigation }: AppStackScreenProp<MobileScreens.TokenDetails>): JSX.Element {
  const { currencyId } = route.params

  return (
    <TokenDetailsContextProvider currencyId={currencyId} navigation={navigation}>
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
      currencyName: token?.name,
    }),
    [address, chainId, token?.name],
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

  const { error } = useTokenDetailsScreenQuery({
    variables: { ...currencyIdToContractInput(currencyId) },
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    returnPartialData: true,
  })

  useEffect(() => setError(error), [error, setError])

  return <TokenDetails />
})

const TokenDetails = memo(function _TokenDetails(): JSX.Element {
  const inModal = useSelector(selectModalState(ModalName.Explore)).isOpen
  const dispatch = useDispatch()

  // #region Handle modal race condition
  // This is a workaround to prevent a crash. The TDP can open as a full screen
  // or in the Explore BSM. When this happens the TDP switches to components
  // that can only be used in a modal causing a crash.
  // This code closes the Explore modal when the TDP is opened as a full screen
  // screen and disallows dynamically changing the TDP components based on the
  // Explore modal state.
  // This behavior should not be needed when we make the TDP full screen only.
  const initialModalState = useRef<boolean | null>(null)
  if (initialModalState.current === null) {
    initialModalState.current = inModal
  } else if (initialModalState.current !== null && initialModalState.current !== inModal && inModal) {
    dispatch(closeModal({ name: ModalName.Explore }))
  }
  // #endregion

  const centerElement = useMemo(() => <HeaderTitleElement />, [])
  const rightElement = useMemo(() => <HeaderRightElement />, [])

  return (
    <>
      <HeaderScrollScreen
        showHandleBar={initialModalState.current}
        renderedInModal={initialModalState.current}
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
      .catch((_error) => setError(_error))
  }, [apolloClient, setError])

  return error ? (
    <AnimatedFlex entering={FadeInDown} exiting={FadeOutDown} px="$spacing24">
      <BaseCard.InlineErrorState onRetry={onRetry} />
    </AnimatedFlex>
  ) : null
})

const TokenDetailsModals = memo(function _TokenDetailsModals(): JSX.Element {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useWalletNavigation()

  const {
    currencyId,
    chainId,
    address,
    activeTransactionType,
    currencyInfo,
    isBuyNativeTokenModalOpen,
    isTokenWarningModalOpen,
    isTestnetWarningModalOpen,
    isContractAddressExplainerModalOpen,
    closeTokenWarningModal,
    closeBuyNativeTokenModal,
    closeTestnetWarningModal,
    closeContractAddressExplainerModal,
    copyAddressToClipboard,
  } = useTokenDetailsContext()

  const onCloseTokenWarning = useCallback(() => {
    closeTokenWarningModal()
  }, [closeTokenWarningModal])

  const onAcknowledgeTokenWarning = useCallback(() => {
    closeTokenWarningModal()
    if (activeTransactionType !== undefined) {
      navigateToSwapFlow({ currencyField: activeTransactionType, currencyAddress: address, currencyChainId: chainId })
    }
  }, [activeTransactionType, address, chainId, closeTokenWarningModal, navigateToSwapFlow])

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

      {isTestnetWarningModalOpen && (
        <TestnetModeModal
          unsupported
          isOpen={isTestnetWarningModalOpen}
          descriptionCopy={t('tdp.noTestnetSupportDescription')}
          onClose={closeTestnetWarningModal}
        />
      )}

      {isBuyNativeTokenModalOpen && (
        <BuyNativeTokenModal chainId={chainId} currencyId={currencyId} onClose={closeBuyNativeTokenModal} />
      )}
      {isContractAddressExplainerModalOpen && (
        <ContractAddressExplainerModal
          onAcknowledge={async () => {
            closeContractAddressExplainerModal()
            await copyAddressToClipboard(address)
          }}
        />
      )}
    </>
  )
})

const TokenDetailsActionButtonsWrapper = memo(function _TokenDetailsActionButtonsWrapper(): JSX.Element | null {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const activeAddress = useActiveAccountAddressWithThrow()
  const { isTestnetModeEnabled } = useEnabledChains()

  const {
    currencyId,
    chainId,
    address,
    currencyInfo,
    openTestnetWarningModal,
    openTokenWarningModal,
    openBuyNativeTokenModal,
    tokenColorLoading,
    navigation,
  } = useTokenDetailsContext()

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
      address: activeAddress,
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
    openBuyNativeTokenModal()
  }, [openBuyNativeTokenModal])

  const onPressSend = useCallback(() => {
    navigateToSend({ currencyAddress: address, chainId })
  }, [address, chainId, navigateToSend])

  const isScreenNavigationReady = useIsScreenNavigationReady({ navigation })

  const getCTAVariant = useTokenDetailsCTAVariant({
    hasTokenBalance,
    isNativeCurrency,
    nativeFiatOnRampCurrency,
    fiatOnRampCurrency,
    bridgingTokenWithHighestBalance,
    hasZeroNativeBalance,
    tokenSymbol: token?.symbol,
    onPressBuyFiatOnRamp,
    onPressGet,
    onPressSwap,
  })

  const actionMenuOptions: StyledContextMenuAction[] = useMemo(
    () => [
      ...(fiatOnRampCurrency ? [{ title: t('common.button.buy'), icon: Bank, onPress: onPressBuyFiatOnRamp }] : []),
      ...(hasTokenBalance && fiatOnRampCurrency
        ? [{ title: t('common.button.sell'), icon: ArrowUpCircle, onPress: () => onPressBuyFiatOnRamp(true) }]
        : []),
      ...(hasTokenBalance ? [{ title: t('common.button.send'), icon: SendRoundedAirplane, onPress: onPressSend }] : []),
      { title: t('common.button.receive'), icon: ArrowDownCircle, onPress: navigateToReceive },
    ],
    [fiatOnRampCurrency, hasTokenBalance, onPressBuyFiatOnRamp, t, onPressSend, navigateToReceive],
  )

  return !isScreenNavigationReady ||
    tokenColorLoading ||
    isNativeCurrencyBalanceLoading ||
    isNativeFiatOnRampCurrencyLoading ||
    isFiatOnRampCurrencyLoading ||
    isBridgingTokenLoading ? null : (
    <AnimatedFlex backgroundColor="$surface1" entering={FadeInDown} style={{ marginBottom: insets.bottom }}>
      <TokenDetailsActionButtons
        ctaButton={getCTAVariant}
        actionMenuOptions={actionMenuOptions}
        userHasBalance={hasTokenBalance}
        onPressDisabled={isTestnetModeEnabled ? openTestnetWarningModal : openTokenWarningModal}
      />
    </AnimatedFlex>
  )
})

const TokenBalancesWrapper = memo(function _TokenBalancesWrapper(): JSX.Element | null {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { currencyId, isChainEnabled } = useTokenDetailsContext()

  const projectTokens = useTokenBasicProjectPartsFragment({ currencyId }).data?.project?.tokens

  const crossChainTokens: Array<{
    address: string | null
    chain: Chain
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
    address: activeAddress,
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
