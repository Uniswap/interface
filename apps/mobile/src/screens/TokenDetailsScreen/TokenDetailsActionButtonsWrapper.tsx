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
import {
  useMultichainBuyVariant,
  useTokenDetailsCTAVariant,
} from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { useTokenDetailsCurrentChainBalance } from 'src/components/TokenDetails/useTokenDetailsCurrentChainBalance'
import { NetworkBalanceSheetContent } from 'src/screens/TokenDetailsScreen/NetworkBalanceSheetContent'
import { useHighestTvlChain } from 'src/screens/TokenDetailsScreen/useHighestTvlChain'
import { useNetworkBalanceSheet } from 'src/screens/TokenDetailsScreen/useNetworkBalanceSheet'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { ArrowDownCircle, ArrowUpCircle, Bank, QrCode, SendRoundedAirplane } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import type { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useTokenBasicInfoPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { useBridgingTokenWithHighestBalance } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { type PortfolioBalance, TokenList } from 'uniswap/src/features/dataApi/types'
import { useIsSupportedFiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/hooks'
import { useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

function getHighestBalanceEntry(balances: PortfolioBalance[]): PortfolioBalance {
  return balances.reduce((best, current) => ((current.balanceUSD ?? 0) > (best.balanceUSD ?? 0) ? current : best))
}

export const TokenDetailsActionButtonsWrapper = memo(
  function TokenDetailsActionButtonsWrapperInner(): JSX.Element | null {
    const { t } = useTranslation()
    const insets = useAppInsets()
    const activeAddress = useActiveAccountAddressWithThrow()
    const { isTestnetModeEnabled } = useEnabledChains()
    const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)

    const { currencyId, chainId, address, currencyInfo, openTokenWarningModal, tokenColorLoading, navigation } =
      useTokenDetailsContext()

    const { navigateToFiatOnRamp, navigateToSwapFlow, navigateToSend, navigateToReceive } = useWalletNavigation()

    const token = useTokenBasicInfoPartsFragment({ currencyId }).data

    const isBlocked = currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

    const isNativeCurrency = isNativeCurrencyAddress(chainId, address)
    const nativeCurrencyAddress = getChainInfo(chainId).nativeCurrency.address

    const { gasBalance, isLoading: isGasBalanceLoading } = useChainGasToken({ chainId, accountAddress: activeAddress })
    const hasZeroGasBalance = gasBalance && gasBalance.equalTo('0')

    const { currency: nativeFiatOnRampCurrency, isLoading: isNativeFiatOnRampCurrencyLoading } =
      useIsSupportedFiatOnRampCurrency(buildCurrencyId(chainId, nativeCurrencyAddress))

    const currentChainBalance = useTokenDetailsCurrentChainBalance()

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

    const hasTokenBalance = multichainTokenUxEnabled ? allChainBalances.length > 0 : Boolean(currentChainBalance)

    // For multichain UX: resolve the chain with the highest balance (computed once, used by multiple handlers)
    const highestBalanceEntry = useMemo(() => {
      if (!multichainTokenUxEnabled || !allChainBalances.length) {
        return null
      }
      return getHighestBalanceEntry(allChainBalances)
    }, [multichainTokenUxEnabled, allChainBalances])

    const highestBalanceCurrencyId = highestBalanceEntry?.currencyInfo.currencyId ?? currencyId

    const { currency: highestBalanceFiatCurrency } = useIsSupportedFiatOnRampCurrency(highestBalanceCurrencyId)

    const { chainId: highestTvlChainId, address: highestTvlAddress } = useHighestTvlChain({ currencyId })

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
      if (multichainTokenUxEnabled && hasMultiChainBalances) {
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

    // Chain selection priority for the Buy (swap) flow:
    // 1. Chain where the user holds the highest balance (they already have a position)
    // 2. Chain with the highest TVL (best liquidity for new buyers with 0 balance)
    // 3. Current TDP chain (fallback when data is unavailable)
    const onPressBuy = useEvent(() => {
      if (isBlocked) {
        openTokenWarningModal()
        return
      }
      if (multichainTokenUxEnabled && highestBalanceEntry) {
        const { currency } = highestBalanceEntry.currencyInfo
        const currencyAddress = currency.isToken ? currency.address : getNativeAddress(currency.chainId)
        navigateToSwapFlow({ currencyField: CurrencyField.OUTPUT, currencyAddress, currencyChainId: currency.chainId })
      } else if (multichainTokenUxEnabled && highestTvlChainId) {
        const currencyAddress = highestTvlAddress ?? getNativeAddress(highestTvlChainId)
        navigateToSwapFlow({ currencyField: CurrencyField.OUTPUT, currencyAddress, currencyChainId: highestTvlChainId })
      } else {
        navigateToSwapFlow({ currencyField: CurrencyField.OUTPUT, currencyAddress: address, currencyChainId: chainId })
      }
    })

    const onPressSell = useEvent(() => {
      if (multichainTokenUxEnabled && hasMultiChainBalances) {
        openSellSheet()
      } else {
        onPressSwap(CurrencyField.INPUT)
      }
    })

    const onPressBuyWithCash = useEvent(() => {
      navigateToFiatOnRamp({ prefilledCurrency: highestBalanceFiatCurrency ?? fiatOnRampCurrency })
    })

    const onPressSellForCash = useEvent(() => {
      navigateToFiatOnRamp({ prefilledCurrency: highestBalanceFiatCurrency ?? fiatOnRampCurrency, isOfframp: true })
    })

    const bridgedWithdrawalInfo = currencyInfo?.bridgedWithdrawalInfo

    const isScreenNavigationReady = useIsScreenNavigationReady({ navigation })

    const getCTAVariant = useTokenDetailsCTAVariant({
      hasTokenBalance,
      isNativeCurrency,
      nativeFiatOnRampCurrency,
      fiatOnRampCurrency,
      bridgingTokenWithHighestBalance,
      hasZeroGasBalance,
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

    const multichainActionMenuOptions: MenuOptionItem[] = useMemo(() => {
      const actions: MenuOptionItem[] = []

      if (hasTokenBalance) {
        actions.push({ label: t('common.button.send'), Icon: SendRoundedAirplane, onPress: onPressSend })
      }

      actions.push({ label: t('common.button.receive'), Icon: QrCode, onPress: navigateToReceive })

      if (highestBalanceFiatCurrency || fiatOnRampCurrency) {
        actions.push({ label: t('fiatOnRamp.action.buyWithCash'), Icon: Bank, onPress: onPressBuyWithCash })
      }

      if (hasTokenBalance && (highestBalanceFiatCurrency || fiatOnRampCurrency)) {
        actions.push({ label: t('fiatOnRamp.action.sellForCash'), Icon: ArrowUpCircle, onPress: onPressSellForCash })
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

      return actions
    }, [
      t,
      hasTokenBalance,
      bridgedWithdrawalInfo,
      highestBalanceFiatCurrency,
      fiatOnRampCurrency,
      onPressSend,
      navigateToReceive,
      onPressBuyWithCash,
      onPressSellForCash,
      onPressWithdraw,
    ])

    const hideActionButtons =
      !isScreenNavigationReady ||
      tokenColorLoading ||
      isGasBalanceLoading ||
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

    const multichainBuyVariant = useMultichainBuyVariant({
      hasTokenBalance,
      isNativeCurrency,
      nativeFiatOnRampCurrency,
      fiatOnRampCurrency,
      bridgingTokenWithHighestBalance,
      hasZeroGasBalance,
      tokenSymbol: token.symbol,
      onPressBuyWithCash,
      onPressGet,
      onPressBuy,
    })

    return hideActionButtons ? null : (
      <AnimatedFlex mb={insets.bottom} backgroundColor="$surface1" entering={FadeInDown}>
        {multichainTokenUxEnabled ? (
          <TokenDetailsBuySellButtons
            actionMenuOptions={multichainActionMenuOptions}
            buyButtonIcon={multichainBuyVariant.icon}
            buyButtonTitle={multichainBuyVariant.title}
            userHasBalance={hasTokenBalance}
            onPressBuy={multichainBuyVariant.onPress}
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

        {multichainTokenUxEnabled && isNetworkSheetOpen && (
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
  },
)
