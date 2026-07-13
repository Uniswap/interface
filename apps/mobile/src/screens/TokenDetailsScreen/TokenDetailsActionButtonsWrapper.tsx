import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { FeatureFlags } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeInDown } from 'react-native-reanimated'
import { MODAL_OPEN_WAIT_TIME } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/rootNavigation'
import { TokenDetailsBuySellButtons } from 'src/components/TokenDetails/TokenDetailsActionButtons'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useMultichainBuyVariant } from 'src/components/TokenDetails/useTokenDetailsCTAVariant'
import { useGatedTokenDetailsRWAMatch } from 'src/components/TokenDetails/useTokenDetailsRWAMatch'
import { NetworkBalanceSheetContent } from 'src/screens/TokenDetailsScreen/NetworkBalanceSheetContent'
import { useHighestTvlChain } from 'src/screens/TokenDetailsScreen/useHighestTvlChain'
import { useNetworkBalanceSheet } from 'src/screens/TokenDetailsScreen/useNetworkBalanceSheet'
import { useIsScreenNavigationReady } from 'src/utils/useIsScreenNavigationReady'
import { ArrowUpCircle, Bank, QrCode, SendRoundedAirplane } from 'ui/src/components/icons'
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
import { noop } from 'utilities/src/react/noop'
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

    const hasTokenBalance = allChainBalances.length > 0

    // For multichain UX: resolve the chain with the highest balance (computed once, used by multiple handlers)
    const highestBalanceEntry = useMemo(() => {
      if (!allChainBalances.length) {
        return null
      }
      return getHighestBalanceEntry(allChainBalances)
    }, [allChainBalances])

    const highestBalanceCurrencyId = highestBalanceEntry?.currencyInfo.currencyId ?? currencyId

    const { currency: highestBalanceFiatCurrency } = useIsSupportedFiatOnRampCurrency(highestBalanceCurrencyId)

    const { chainId: highestTvlChainId, address: highestTvlAddress } = useHighestTvlChain({
      currencyId,
      accountAddress: activeAddress,
    })

    const onPressSwap = useEvent((currencyField: CurrencyField) => {
      if (isBlocked) {
        openTokenWarningModal()
      } else {
        navigateToSwapFlow({ currencyField, currencyAddress: address, currencyChainId: chainId })
      }
    })

    const onPressGet = useEvent(() => {
      navigate(ModalName.BuyNativeToken, {
        chainId,
        currencyId,
      })
    })

    const onPressSend = useEvent(() => {
      if (hasMultiChainBalances) {
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
      if (highestBalanceEntry) {
        const { currency } = highestBalanceEntry.currencyInfo
        const currencyAddress = currency.isToken ? currency.address : getNativeAddress(currency.chainId)
        navigateToSwapFlow({ currencyField: CurrencyField.OUTPUT, currencyAddress, currencyChainId: currency.chainId })
      } else if (highestTvlChainId) {
        const currencyAddress = highestTvlAddress ?? getNativeAddress(highestTvlChainId)
        navigateToSwapFlow({ currencyField: CurrencyField.OUTPUT, currencyAddress, currencyChainId: highestTvlChainId })
      } else {
        navigateToSwapFlow({ currencyField: CurrencyField.OUTPUT, currencyAddress: address, currencyChainId: chainId })
      }
    })

    const onPressSell = useEvent(() => {
      if (hasMultiChainBalances) {
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

    // Trading is geo-restricted for whitelisted RWA stocks in blocked regions; the swap flow
    // already enforces this, so surface it on the CTA instead of letting users tap into a dead end.
    // Region comes from compliance v2 (ISSUER_SPECIFIC_RWA); the RWA-token check is the whitelist match.
    const rwaMatch = useGatedTokenDetailsRWAMatch(FeatureFlags.RWATdp)
    const isRWARegionBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
    const isRWATradeBlocked = Boolean(rwaMatch) && isRWARegionBlocked

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
        <TokenDetailsBuySellButtons
          actionMenuOptions={multichainActionMenuOptions}
          buyButtonDisabled={isRWATradeBlocked}
          buyButtonIcon={isRWATradeBlocked ? undefined : multichainBuyVariant.icon}
          buyButtonTitle={isRWATradeBlocked ? t('tdp.button.unavailableToTrade') : multichainBuyVariant.title}
          sellButtonDisabled={isRWATradeBlocked}
          userHasBalance={hasTokenBalance}
          onPressBuy={isRWATradeBlocked ? noop : multichainBuyVariant.onPress}
          onPressDisabled={isRWATradeBlocked ? undefined : onPressDisabled}
          onPressSell={isRWATradeBlocked ? noop : onPressSell}
        />

        {isNetworkSheetOpen && (
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
