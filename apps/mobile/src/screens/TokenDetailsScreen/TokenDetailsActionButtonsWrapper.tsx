import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown } from 'react-native-reanimated'
import { MODAL_OPEN_WAIT_TIME } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/rootNavigation'
import {
  TokenDetailsBuySellButtons,
  TokenDetailsSwapButtons,
} from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenDetailsCTAVariant } from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { NetworkBalanceSheetContent } from 'src/screens/TokenDetailsScreen/NetworkBalanceSheetContent'
import { useNetworkBalanceSheet } from 'src/screens/TokenDetailsScreen/useNetworkBalanceSheet'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { ArrowDownCircle, ArrowUpCircle, Bank, SendRoundedAirplane } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import type { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useTokenBasicInfoPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export const TokenDetailsActionButtonsWrapper = memo(function _TokenDetailsActionButtonsWrapper(): JSX.Element | null {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const activeAddress = useActiveAccountAddressWithThrow()
  const { isTestnetModeEnabled } = useEnabledChains()
  const isMultichainTokenUx = useFeatureFlag(FeatureFlags.MultichainTokenUx)

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

  const {
    allChainBalances,
    hasMultiChainBalances,
    isNetworkSheetOpen,
    openSellSheet,
    openSendSheet,
    onCloseNetworkSheet,
    onSelectNetwork,
  } = useNetworkBalanceSheet({ currencyId, chainId })

  const onPressSwap = useEvent((currencyField: CurrencyField) => {
    if (isBlocked) {
      openTokenWarningModal()
    } else {
      navigateToSwapFlow({ currencyField, currencyAddress: address, currencyChainId: chainId })
    }
  })

  const onPressBuyFiatOnRamp = useEvent((isOfframp: boolean = false): void => {
    navigateToFiatOnRamp({ prefilledCurrency: fiatOnRampCurrency, isOfframp })
  })

  const onPressGet = useEvent(() => {
    navigate(ModalName.BuyNativeToken, {
      chainId,
      currencyId,
    })
  })

  const onPressSend = useEvent(() => {
    if (isMultichainTokenUx && hasMultiChainBalances) {
      openSendSheet()
    } else {
      navigateToSend({ currencyAddress: address, chainId })
    }
  })

  const onPressWithdraw = useEvent(() => {
    setTimeout(() => {
      navigate(ModalName.Wormhole, {
        currencyInfo,
      })
    }, MODAL_OPEN_WAIT_TIME)
  })

  const onPressBuy = useEvent(() => onPressSwap(CurrencyField.OUTPUT))
  const onPressSell = useEvent(() => {
    if (isMultichainTokenUx && hasMultiChainBalances) {
      openSellSheet()
    } else {
      onPressSwap(CurrencyField.INPUT)
    }
  })

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
      actions.push({
        label: t('common.button.buy'),
        Icon: Bank,
        onPress: onPressBuyFiatOnRamp,
      })
    }

    if (bridgedWithdrawalInfo && hasTokenBalance) {
      actions.push({
        label: t('common.withdraw'),
        Icon: ArrowUpCircle,
        onPress: onPressWithdraw,
        subheader: t('bridgedAsset.wormhole.toNativeChain', { nativeChainName: bridgedWithdrawalInfo.chain }),
        actionType: 'external-link',
        height: 56,
      })
    }

    if (hasTokenBalance && fiatOnRampCurrency) {
      actions.push({
        label: t('common.button.sell'),
        Icon: ArrowUpCircle,
        onPress: () => onPressBuyFiatOnRamp(true),
      })
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

  // Secondary actions only (Send, Receive, Withdraw) — trade actions are handled by the primary CTAs
  const multichainActionMenuOptions: MenuOptionItem[] = useMemo(() => {
    const actions: MenuOptionItem[] = []

    if (hasTokenBalance) {
      actions.push({ label: t('common.button.send'), Icon: SendRoundedAirplane, onPress: onPressSend })
    }

    actions.push({ label: t('common.button.receive'), Icon: ArrowDownCircle, onPress: navigateToReceive })

    if (bridgedWithdrawalInfo && hasTokenBalance) {
      actions.push({
        label: t('common.withdraw'),
        Icon: ArrowUpCircle,
        onPress: onPressWithdraw,
        subheader: t('bridgedAsset.wormhole.toNativeChain', { nativeChainName: bridgedWithdrawalInfo.chain }),
        actionType: 'external-link',
        height: 56,
      })
    }

    return actions
  }, [t, hasTokenBalance, bridgedWithdrawalInfo, onPressSend, navigateToReceive, onPressWithdraw])

  const hideActionButtons =
    !isScreenNavigationReady ||
    tokenColorLoading ||
    isNativeCurrencyBalanceLoading ||
    isNativeFiatOnRampCurrencyLoading ||
    isFiatOnRampCurrencyLoading ||
    isBridgingTokenLoading

  const onPressDisabled = isTestnetModeEnabled
    ? (): void =>
        navigate(ModalName.TestnetMode, {
          unsupported: true,
          descriptionCopy: t('tdp.noTestnetSupportDescription'),
        })
    : openTokenWarningModal

  return hideActionButtons ? null : (
    <AnimatedFlex mb={insets.bottom} backgroundColor="$surface1" entering={FadeInDown}>
      {isMultichainTokenUx ? (
        <TokenDetailsBuySellButtons
          actionMenuOptions={multichainActionMenuOptions}
          userHasBalance={hasTokenBalance}
          onPressBuy={onPressBuy}
          onPressDisabled={onPressDisabled}
          onPressSell={onPressSell}
        />
      ) : (
        <TokenDetailsSwapButtons
          actionMenuOptions={actionMenuOptions}
          ctaButton={getCTAVariant}
          userHasBalance={hasTokenBalance}
          onPressDisabled={onPressDisabled}
        />
      )}

      {isMultichainTokenUx && isNetworkSheetOpen && (
        <Modal
          overrideInnerContainer
          enableDynamicSizing
          name={ModalName.NetworkBalanceSelector}
          onClose={onCloseNetworkSheet}
        >
          <NetworkBalanceSheetContent allChainBalances={allChainBalances} onSelectBalance={onSelectNetwork} />
        </Modal>
      )}
    </AnimatedFlex>
  )
})
