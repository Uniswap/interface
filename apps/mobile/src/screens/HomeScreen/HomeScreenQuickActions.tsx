// oxlint-disable typescript/no-duplicate-type-constituents
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { ArrowDownCircle } from '@universe/mycelium/icons/ArrowDownCircle'
import { CoinConvert } from '@universe/mycelium/icons/CoinConvert'
import { MinusCircle } from '@universe/mycelium/icons/MinusCircle'
import { PlusCircle } from '@universe/mycelium/icons/PlusCircle'
import { SendAction } from '@universe/mycelium/icons/SendAction'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { iconSizes, spacing } from '@universe/mycelium/tokens'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsForRegionBlocked } from 'uniswap/src/features/fiatOnRamp/useIsForRegionBlocked'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/portfolio/balances/hooks'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ElementName, MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useIsPortfolioZero } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsPortfolioZero'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const MIN_BUTTON_WIDTH = 102

type IconComponent =
  | typeof CoinConvert
  | typeof PlusCircle
  | typeof MinusCircle
  | typeof SendAction
  | typeof ArrowDownCircle
type ActionItem = {
  Icon: IconComponent
  label: string
  name: ElementName
  eventName?: MobileEventName
  onPress: () => Promise<void>
}

const contentContainerStyle = { paddingRight: spacing.spacing8 }

const keyExtractor = (item: ActionItem): string => {
  return item.name
}

/**
 * CTA buttons that appear at top of the screen showing actions such as
 * "Send", "Receive", "Buy" etc.
 */
export function HomeScreenQuickActions(): JSX.Element {
  const colors = useSporeColors()
  const iconSize = iconSizes.icon24
  const contentColor = colors.accent1.val
  const activeScale = 0.96
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { hapticFeedback } = useHapticFeedback()
  const openReceiveModal = useOpenReceiveModal()
  const { isTestnetModeEnabled, defaultChainId } = useEnabledChains()
  const isOnrampBlocked = useIsForRegionBlocked({ isOfframp: false })
  const isOfframpBlocked = useIsForRegionBlocked({ isOfframp: true })
  const isPortfolioZero = useIsPortfolioZero()

  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId({
    evmAddress: activeAccountAddress,
    chainId: persistedFilteredChainIds?.[CurrencyField.INPUT],
  })

  const onPressSwap = useCallback(async () => {
    navigate(
      ModalName.Swap,
      prepareSwapFormState({
        inputCurrencyId,
        defaultChainId,
        filteredChainIdsOverride: persistedFilteredChainIds,
      }),
    )

    await hapticFeedback.light()
  }, [inputCurrencyId, hapticFeedback, persistedFilteredChainIds, defaultChainId])

  const triggerHaptics = useCallback(async () => await hapticFeedback.light(), [hapticFeedback])
  const onPressSend = useCallback(async () => {
    dispatch(openModal({ name: ModalName.Send }))
    await triggerHaptics()
  }, [dispatch, triggerHaptics])

  const onPressReceive = useCallback(async () => {
    openReceiveModal()
    await triggerHaptics()
  }, [openReceiveModal, triggerHaptics])

  const onPressFORAction = useCallback(
    async (entry: 'onramp' | 'offramp'): Promise<void> => {
      await triggerHaptics()
      if (isTestnetModeEnabled) {
        navigate(ModalName.TestnetMode, {
          unsupported: true,
          descriptionCopy: t('tdp.noTestnetSupportDescription'),
        })
        return
      }
      if (!isPortfolioZero) {
        navigate(ModalName.FiatOnRampAction, { entry })
        return
      }
      if (entry === 'offramp' ? isOfframpBlocked : isOnrampBlocked) {
        navigate(ModalName.CexTransferInfoModal)
        return
      }
      dispatch(
        openModal({
          name: ModalName.FiatOnRampAggregator,
          ...(entry === 'offramp' && { initialState: { isOfframp: true } }),
        }),
      )
    },
    [triggerHaptics, isTestnetModeEnabled, isOnrampBlocked, isOfframpBlocked, isPortfolioZero, dispatch, t],
  )

  // PR #4621 Necessary to declare these as direct dependencies due to race
  // condition with initializing react-i18next and useMemo
  const sendLabel = t('home.label.send')
  const receiveLabel = t('home.label.receive')
  const buyLabel = t('common.buy.label')
  const sellLabel = t('common.sell.label')
  const actions = useMemo(
    () => [
      {
        Icon: CoinConvert,
        label: 'Swap',
        name: ElementName.Swap,
        onPress: onPressSwap,
      },
      {
        Icon: PlusCircle,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        label: buyLabel,
        name: ElementName.Buy,
        onPress: () => onPressFORAction('onramp'),
      },
      {
        Icon: SendAction,
        label: sendLabel,
        name: ElementName.Send,
        onPress: onPressSend,
      },
      {
        Icon: ArrowDownCircle,
        label: receiveLabel,
        name: ElementName.Receive,
        onPress: onPressReceive,
      },
      {
        Icon: MinusCircle,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        label: sellLabel,
        name: ElementName.Sell,
        onPress: () => onPressFORAction('offramp'),
      },
    ],
    [onPressSwap, buyLabel, onPressFORAction, sendLabel, onPressSend, receiveLabel, onPressReceive, sellLabel],
  )

  const renderItem = useCallback(
    ({ item: { eventName, name, label, Icon, onPress } }: ListRenderItemInfo<ActionItem>) => (
      <Trace key={name} logPress element={name} eventOnTrigger={eventName}>
        <TouchableArea
          width={MIN_BUTTON_WIDTH}
          mr="$spacing8"
          scaleTo={activeScale}
          dd-action-name={name}
          testID={name}
          onPress={onPress}
        >
          {/* Content-sized cell: percentage/fill heights resolve to 0 inside an
              auto-height horizontal FlatList row under the mycelium compat primitives. */}
          <Flex backgroundColor="$accent2" borderRadius="$rounded20" py="$spacing16" px="$spacing12" gap="$spacing12">
            <Icon color={contentColor} size={iconSize} strokeWidth={2} />
            <Text color={contentColor} variant="buttonLabel2">
              {label}
            </Text>
          </Flex>
        </TouchableArea>
      </Trace>
    ),
    [activeScale, contentColor, iconSize],
  )

  return (
    <Flex>
      <FlatList
        horizontal
        ListHeaderComponent={<Flex pl="$spacing20" />}
        data={actions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
      />
    </Flex>
  )
}
