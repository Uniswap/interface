import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import type { RateDisplay } from '../types'
import { RateRatio } from './RateRatio'

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
