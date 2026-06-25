import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme/fonts'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isAddress } from '~/chains'

export function SendFeesToAddressSection({
  controlColumnWidthPx,
  value,
  onValueChange,
  poolOwnerAddress,
}: {
  controlColumnWidthPx: number
  value: string
  onValueChange: (value: string) => void
  poolOwnerAddress: string | null
}) {
  const { t } = useTranslation()
  const [touched, setTouched] = useState(false)
  const media = useMedia()

  useEffect(() => {
    if (value === '') {
      setTouched(false)
    }
  }, [value])
  const stackInputBelow = Boolean(media.md)

  const hasError = touched && value !== '' && !isAddress(value)

  return (
    <Flex gap="$spacing8">
      <Flex
        row={!stackInputBelow}
        alignItems={stackInputBelow ? 'stretch' : 'center'}
        gap="$spacing16"
        flexWrap="nowrap"
        width="100%"
      >
        <Flex
          flex={stackInputBelow ? undefined : 1}
          flexShrink={1}
          minWidth={0}
          width={stackInputBelow ? '100%' : undefined}
        >
          <Text variant="buttonLabel3" color="$neutral1" height={20} lineHeight={20}>
            {t('toucan.createAuction.step.customizePool.feeClaim')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.createAuction.step.customizePool.feeClaim.description')}
          </Text>
        </Flex>
        <Flex flexShrink={0} width={stackInputBelow ? '100%' : controlColumnWidthPx} maxWidth="100%" gap="$spacing4">
          <Flex
            backgroundColor="$surface2"
            borderWidth={1}
            borderColor={hasError ? '$statusCritical' : '$surface3'}
            borderRadius="$rounded16"
            px="$spacing12"
            py="$spacing8"
          >
            <Text variant="body4" color="$neutral2" pb="$spacing2">
              {t('common.address')}
            </Text>
            <Trace logFocus element={ElementName.AuctionFeeForwardAddress}>
              <Input
                value={value}
                onChangeText={onValueChange}
                onBlur={() => setTouched(true)}
                placeholder={poolOwnerAddress ?? ''}
                placeholderTextColor="$neutral3"
                accessibilityLabel={t('toucan.createAuction.step.customizePool.feeClaim.recipientAddress')}
                height={fonts.body4.lineHeight}
                fontSize={fonts.body4.fontSize}
                lineHeight={fonts.body4.lineHeight}
                fontWeight={fonts.body4.fontWeight}
                color="$neutral1"
                px="$none"
                backgroundColor="$transparent"
              />
            </Trace>
          </Flex>
          {hasError && (
            <Text variant="body4" color="$statusCritical" textAlign="center">
              {t('toucan.createAuction.invalidAddressError')}
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
