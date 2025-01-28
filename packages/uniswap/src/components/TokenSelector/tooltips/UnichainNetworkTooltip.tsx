import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text } from 'ui/src'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import {
  TOOLTIP_ICON_SIZE,
  TokenSelectorTooltipBase,
} from 'uniswap/src/components/TokenSelector/tooltips/TokenSelectorTooltipBase'
import { setHasSeenNetworkSelectorTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface UnichainTooltipProps {
  onPress: () => void
}

export function UnichainTooltip({ onPress }: UnichainTooltipProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  return (
    <TokenSelectorTooltipBase
      showNewTag
      icon={<NetworkLogo chainId={UniverseChainId.Unichain} size={TOOLTIP_ICON_SIZE} />}
      actionElement={
        <Text variant="buttonLabel3" color="$accent1" hoverStyle={{ color: '$accent1Hovered' }}>
          {t('unichain.promotion.tooltip.switch')}
        </Text>
      }
      title={t('unichain.promotion.tooltip.title')}
      subtitle={t('unichain.promotion.tooltip.description')}
      placement={{
        delayMs: 750,
        maxWidth: 300,
        left: 40,
      }}
      onPress={onPress}
      onDismiss={() => dispatch(setHasSeenNetworkSelectorTooltip(true))}
    />
  )
}
