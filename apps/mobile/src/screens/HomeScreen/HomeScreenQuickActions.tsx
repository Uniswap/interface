import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useOpenReceiveModal } from 'src/features/modals/hooks/useOpenReceiveModal'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowDownCircle, Bank, SendAction, SwapDotted } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances/balances'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { ElementName, MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const MIN_BUTTON_WIDTH = 102

type IconComponent = typeof SwapDotted | typeof Bank | typeof SendAction | typeof ArrowDownCircle
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
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)
  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

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

  const onPressBuy = useCallback(async (): Promise<void> => {
    await triggerHaptics()
    if (isTestnetModeEnabled) {
      navigate(ModalName.TestnetMode, {
        unsupported: true,
        descriptionCopy: t('tdp.noTestnetSupportDescription'),
      })
      return
    }
    disableForKorea
      ? navigate(ModalName.KoreaCexTransferInfoModal)
      : dispatch(
          openModal({
            name: ModalName.FiatOnRampAggregator,
          }),
        )
  }, [triggerHaptics, isTestnetModeEnabled, disableForKorea, dispatch, t])

  // PR #4621 Necessary to declare these as direct dependencies due to race
  // condition with initializing react-i18next and useMemo
  const forLabel = t('home.label.for')
  const sendLabel = t('home.label.send')
  const receiveLabel = t('home.label.receive')
  const actions = useMemo(
    () => [
      ...(isBottomTabsEnabled
        ? [
            {
              Icon: SwapDotted,
              label: 'Swap',
              name: ElementName.Swap,
              onPress: onPressSwap,
            },
          ]
        : []),
      {
        Icon: Bank,
        eventName: MobileEventName.FiatOnRampQuickActionButtonPressed,
        label: forLabel,
        name: ElementName.Buy,
        onPress: onPressBuy,
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
    ],
    [isBottomTabsEnabled, onPressSwap, forLabel, onPressBuy, sendLabel, onPressSend, receiveLabel, onPressReceive],
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: +activeScale
  const renderItem = useCallback(
    ({ item: { eventName, name, label, Icon, onPress } }: ListRenderItemInfo<ActionItem>) => (
      <Trace key={name} logPress element={name} eventOnTrigger={eventName}>
        <TouchableArea
          width={MIN_BUTTON_WIDTH}
          mr="$spacing8"
          scaleTo={activeScale}
          dd-action-name={name}
          onPress={onPress}
        >
          <Flex
            fill
            backgroundColor="$accent2"
            borderRadius="$rounded20"
            py="$spacing16"
            px="$spacing12"
            gap="$spacing12"
            justifyContent="space-between"
            height="100%"
          >
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

  if (!isBottomTabsEnabled) {
    return (
      <Flex centered row gap="$spacing8" px="$spacing12">
        {actions.map(({ eventName, name, label, Icon, onPress }) => (
          <Trace key={name} logPress element={name} eventOnTrigger={eventName}>
            <TouchableArea flex={1} dd-action-name={name} scaleTo={activeScale} onPress={onPress}>
              <Flex
                fill
                backgroundColor="$accent2"
                borderRadius="$rounded20"
                py="$spacing16"
                px="$spacing12"
                gap="$spacing12"
                justifyContent="space-between"
              >
                <Icon color={contentColor} size={iconSize} strokeWidth={2} />
                <Text color={contentColor} variant="buttonLabel2">
                  {label}
                </Text>
              </Flex>
            </TouchableArea>
          </Trace>
        ))}
      </Flex>
    )
  }

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
