import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text } from 'ui/src'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import {
  TOOLTIP_ICON_SIZE,
  TokenSelectorTooltipBase,
} from 'uniswap/src/components/TokenSelector/tooltips/TokenSelectorTooltipBase'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { setHasSeenNetworkSelectorTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isInterface } from 'utilities/src/platform'

interface UnichainTooltipProps {
  onPress: () => void
}

export function UnichainTooltip({ onPress }: UnichainTooltipProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { usePathname } = useUrlContext()
  const pathname = usePathname()

  // Only show tooltip on swap, landing, and explore pages
  if (isInterface && !(pathname.includes('swap') || pathname.includes('explore') || pathname === '/')) {
    return null
  }

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
      subtitle={t('unichain.promotion.description')}
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
