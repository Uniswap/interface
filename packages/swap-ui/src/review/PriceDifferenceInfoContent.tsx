import { Text, TouchableArea } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import type { InfoContainer } from '../types'

export interface PriceDifferenceCaptionProps {
  /** Pre-translated explainer; the adapter picks the classic or UniswapX wording. */
  caption: string
  container: InfoContainer
}

/** Caption body of the price-difference tooltip or modal. Content only; the shell is the adapter's. */
export function PriceDifferenceCaption({ caption, container }: PriceDifferenceCaptionProps): JSX.Element {
  const inTooltip = container === 'tooltip'

  return (
    <Text color="$neutral2" textAlign={inTooltip ? 'left' : 'center'} variant={inTooltip ? 'body4' : 'body2'}>
      {caption}
    </Text>
  )
}

export interface PriceDifferenceLearnMoreButtonProps {
  container: InfoContainer
  /** The view never resolves the help URL; the adapter opens it. */
  onPress: () => void
}

export function PriceDifferenceLearnMoreButton({
  container,
  onPress,
}: PriceDifferenceLearnMoreButtonProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <TouchableArea onPress={onPress}>
      <Text
        // Legacy web hover color under the TouchableArea group anchor; no-op on native (hover state never fires).
        className="group-hover:[color:var(--stext-neutral1Hovered)]"
        color="$neutral1"
        variant={container === 'tooltip' ? 'body4' : 'buttonLabel2'}
      >
        {t('common.button.learn')}
      </Text>
    </TouchableArea>
  )
}
