import { Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IndicativeLoadingWrapper } from '../shared/IndicativeLoadingWrapper'
import type { SlippageDisplay } from '../types'

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

export interface SlippageRowProps {
  /** Slot: a `SlippageRowLabel`, normally wrapped by the adapter in the slippage info shell. */
  label: ReactNode
  slippage: SlippageDisplay
  /** Indicative quote with no tolerance yet: the value renders as the shimmer skeleton. */
  isLoading?: boolean
}

export function SlippageRow({ label, slippage, isLoading }: SlippageRowProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing12" justifyContent="space-between">
      {label}
      <IndicativeLoadingWrapper loading={isLoading}>
        <Flex centered row gap="$spacing8">
          {!slippage.isCustom ? (
            <Flex centered backgroundColor="$surface3" borderRadius="$rounded6" height={20} px="$spacing8">
              <Text color="$neutral1" variant="buttonLabel4" lineHeight={16}>
                {t('swap.settings.slippage.control.auto')}
              </Text>
            </Flex>
          ) : null}
          <Text color={slippage.exceedsAuto ? '$statusWarning' : '$neutral1'} variant="body3">
            {slippage.isZero ? t('common.none') : slippage.tolerance}
          </Text>
        </Flex>
      </IndicativeLoadingWrapper>
    </Flex>
  )
}
