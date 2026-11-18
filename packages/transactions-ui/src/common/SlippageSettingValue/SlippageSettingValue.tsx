import { Flex, Text } from '@universe/mycelium'
import type { SlippageDisplay } from '@universe/transactions-ui/src/common/types'
import { useTranslation } from 'react-i18next'

export interface SlippageSettingValueProps {
  /** `tolerance` always renders; the Auto pill shows unless the value is custom or the transaction carries no slippage. */
  slippage: Pick<SlippageDisplay, 'tolerance' | 'isCustom' | 'isZero'>
}

/**
 * The value of the native Max slippage settings row, e.g. `[Auto] 0.5%`. Pressing the row
 * opens SlippageScreen; on web the row's value is the SlippageInlineInput editor instead.
 *
 * Replaces SlippageControl.native (components/settings, wrapped by the swap
 * SlippageControl.native).
 */
export function SlippageSettingValue({ slippage }: SlippageSettingValueProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row gap="$spacing8">
      {!slippage.isCustom && !slippage.isZero ? (
        <Flex centered backgroundColor="$accent2" borderRadius="$roundedFull" px="$spacing8">
          <Text color="$accent1" variant="buttonLabel3">
            {t('swap.settings.slippage.control.auto')}
          </Text>
        </Flex>
      ) : null}
      <Text color="$neutral2" variant="subheading2">
        {slippage.tolerance}
      </Text>
    </Flex>
  )
}
