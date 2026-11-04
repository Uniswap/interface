import { Flex, Text } from '@universe/mycelium'
import { RateRatio } from '@universe/transactions-ui/src/swap/Rate/RateRatio'
import type { RateDisplay } from '@universe/transactions-ui/src/swap/types'
import { useTranslation } from 'react-i18next'

export interface RateRowProps {
  /** Both orientations pre-formatted. RateRatio owns the invert toggle. */
  rate: RateDisplay
}

/** The "Rate" line of the review details: label left, tap-to-invert rate right-aligned. */
export function RateRow({ rate }: RateRowProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="$neutral2" variant="body3">
        {t('swap.details.rate')}
      </Text>
      <RateRatio rate={rate} justifyContent="flex-end" />
    </Flex>
  )
}
