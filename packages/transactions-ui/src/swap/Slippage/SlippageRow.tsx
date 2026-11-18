import { Flex, Text } from '@universe/mycelium'
import { AutoPill } from '@universe/transactions-ui/src/common/AutoPill/AutoPill'
import { DetailRow } from '@universe/transactions-ui/src/common/DetailRow/DetailRow'
import type { SlippageDisplay } from '@universe/transactions-ui/src/common/types'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface SlippageRowLabelProps {
  /** Chained (multi-step) trade: the label reads "Total slippage" instead of "Max slippage". */
  isChained: boolean
}

/** Left side of the row, exported on its own so the adapter can wrap it in the info tooltip or modal shell. */
export function SlippageRowLabel({ isChained }: SlippageRowLabelProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row shrink alignItems="center" gap="$spacing4">
      <Text color="$neutral2" numberOfLines={3} variant="body3">
        {isChained ? t('swap.details.slippage.total') : t('swap.details.slippage')}
      </Text>
    </Flex>
  )
}

function SlippageValue({ slippage }: { slippage: SlippageDisplay }): JSX.Element {
  const { t } = useTranslation()

  // Own container: the pill sits 8 from the tolerance, wider than DetailRow's value gap.
  return (
    <Flex centered row gap="$spacing8">
      {!slippage.isCustom ? <AutoPill label={t('swap.settings.slippage.control.auto')} /> : null}
      <Text color={slippage.exceedsAuto ? '$statusWarning' : '$neutral1'} variant="body3">
        {slippage.isZero ? t('common.none') : slippage.tolerance}
      </Text>
    </Flex>
  )
}

export interface SlippageRowProps {
  /** Slot: a `SlippageRowLabel`, normally wrapped by the adapter in the slippage info shell. */
  label: ReactNode
  slippage: SlippageDisplay
  /** Indicative quote with no tolerance yet: the value renders as the shimmer skeleton. */
  isLoading?: boolean
}

export function SlippageRow({ label, slippage, isLoading }: SlippageRowProps): JSX.Element {
  return <DetailRow isLoading={isLoading} label={label} value={<SlippageValue slippage={slippage} />} />
}
