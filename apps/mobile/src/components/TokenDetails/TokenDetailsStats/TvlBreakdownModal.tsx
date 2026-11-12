import { Button, Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { TokenTvlBreakdown } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'

function TvlBreakdownRow({ label, value }: { label: string; value: number }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Flex row justifyContent="space-between" gap="$spacing4">
      <Text color="$neutral2" variant="subheading2">
        {label}
      </Text>
      <Text color="$neutral1" flex={1} textAlign="right" variant="subheading2">
        {convertFiatAmountFormatted(value, NumberType.FiatStandardNoDecimals)}
      </Text>
    </Flex>
  )
}

export const TvlBreakdownModal = memo(function TvlBreakdownModalInner({
  breakdown,
  symbol,
  onClose,
}: {
  breakdown: TokenTvlBreakdown
  symbol: string
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Modal name={ModalName.TvlBreakdown} onClose={onClose}>
      <Flex gap="$spacing24" px="$spacing24" pt="$spacing12" pb="$spacing12">
        <Flex gap="$spacing12" testID={TestID.TokenDetailsStatsTvlBreakdown}>
          <TvlBreakdownRow label={t('token.stats.tvl.tokenInPools', { symbol })} value={breakdown.tokenTvl} />
          <Flex pb="$spacing4">
            <TvlBreakdownRow label={t('token.stats.tvl.pairedTokens')} value={breakdown.pairedTvl} />
          </Flex>
          <Flex borderTopWidth="$spacing1" borderColor="$surface3" pt="$spacing12">
            <TvlBreakdownRow label={t('token.stats.tvl.allPools', { symbol })} value={breakdown.poolsTvl} />
          </Flex>
        </Flex>
        <Flex row>
          <Button emphasis="secondary" onPress={onClose}>
            {t('common.button.close')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
})
