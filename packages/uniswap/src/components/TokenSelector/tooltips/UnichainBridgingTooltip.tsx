import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import {
  TOOLTIP_ICON_SIZE,
  TokenSelectorTooltipBase,
} from 'uniswap/src/components/TokenSelector/tooltips/TokenSelectorTooltipBase'
import { setHasSeenBridgingTooltip } from 'uniswap/src/features/behaviorHistory/slice'

export function UnichainBridgingTooltip(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const markAsSeen = (): void => {
    dispatch(setHasSeenBridgingTooltip(true))
  }

  return (
    <TokenSelectorTooltipBase
      icon={<Shuffle color="$accent1" size={TOOLTIP_ICON_SIZE} />}
      actionElement={
        <Text variant="buttonLabel3" color="$neutral2" hoverStyle={{ color: '$neutral2Hovered' }}>
          {t('common.dismiss')}
        </Text>
      }
      title={t('unichain.promotion.bridging.description')}
      subtitle={t('unichain.promotion.bridging.tooltip.description')}
      placement={{
        delayMs: 800,
        maxWidth: 280,
        top: 54,
      }}
      onPress={markAsSeen}
      onDismiss={markAsSeen}
    />
  )
}
