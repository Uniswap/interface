import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Text, TouchableArea } from 'ui/src'
import { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { ArrowUpCircle, Bank, CoinConvert } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'

type ActionRow = {
  Icon: GeneratedIcon
  title: string
  subtitle: string
  elementName: ElementName
  onPress: () => void
}

export function FiatOnRampActionModal({ route }: AppStackScreenProp<typeof ModalName.FiatOnRampAction>): JSX.Element {
  const { entry } = route.params
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { onClose } = useReactNavigationModal()
  const isOfframp = entry === 'offramp'
  const disableForKorea = useFeatureFlag(FeatureFlags.DisableFiatOnRampKorea)

  const onPressFiatOption = useCallback((): void => {
    onClose()
    if (disableForKorea) {
      navigate(ModalName.KoreaCexTransferInfoModal)
      return
    }
    dispatch(
      openModal({
        name: ModalName.FiatOnRampAggregator,
        ...(isOfframp && { initialState: { isOfframp: true } }),
      }),
    )
  }, [onClose, dispatch, isOfframp, disableForKorea])

  const onPressSwap = useCallback((): void => {
    onClose()
    navigate(ModalName.Swap)
  }, [onClose])

  const actions: ActionRow[] = useMemo(
    () => [
      isOfframp
        ? {
            Icon: ArrowUpCircle,
            title: t('fiatOnRamp.action.sellForCash'),
            subtitle: t('fiatOnRamp.action.sellForCash.description'),
            elementName: ElementName.Sell,
            onPress: onPressFiatOption,
          }
        : {
            Icon: Bank,
            title: t('fiatOnRamp.action.buyWithCash'),
            subtitle: t('fiatOnRamp.action.buyWithCash.description'),
            elementName: ElementName.Buy,
            onPress: onPressFiatOption,
          },
      {
        Icon: CoinConvert,
        title: t('fiatOnRamp.action.swapTokens'),
        subtitle: t('fiatOnRamp.action.swapTokens.description'),
        elementName: ElementName.Swap,
        onPress: onPressSwap,
      },
    ],
    [isOfframp, t, onPressFiatOption, onPressSwap],
  )

  return (
    <Modal name={ModalName.FiatOnRampAction} onClose={onClose}>
      <Flex gap="$spacing4" pb="$spacing12" px="$spacing24">
        {actions.map(({ Icon, title, subtitle, elementName, onPress }) => (
          <Trace key={elementName} logPress element={elementName}>
            <TouchableArea row gap="$spacing16" alignItems="center" py="$spacing12" onPress={onPress}>
              <Flex
                centered
                backgroundColor="$accent2"
                borderRadius="$rounded12"
                height="$spacing40"
                width="$spacing40"
              >
                <Icon color="$accent1" size="$icon.24" />
              </Flex>
              <Flex flex={1} gap="$spacing4" justifyContent="center">
                <Text variant="body1" color="$neutral1">
                  {title}
                </Text>
                <Text variant="body2" color="$neutral2">
                  {subtitle}
                </Text>
              </Flex>
            </TouchableArea>
          </Trace>
        ))}
      </Flex>
    </Modal>
  )
}
