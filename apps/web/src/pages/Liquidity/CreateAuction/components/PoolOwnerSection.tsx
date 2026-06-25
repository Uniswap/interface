import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text } from 'ui/src'
import { fonts } from 'ui/src/theme/fonts'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isAddress } from '~/chains'

export function isValidPoolOwner(value: string): boolean {
  return value === '' || isAddress(value)
}

export function PoolOwnerSection({
  value,
  onValueChange,
  activeAddress,
}: {
  value: string
  onValueChange: (value: string) => void
  activeAddress: string | null
}) {
  const { t } = useTranslation()
  const [touched, setTouched] = useState(false)

  const hasError = touched && !isValidPoolOwner(value)

  return (
    <Flex gap="$spacing4">
      <Text variant="subheading1" color="$neutral1">
        {t('toucan.createAuction.step.customizePool.poolOwner')}
      </Text>
      <Text variant="body3" color="$neutral2">
        {t('toucan.createAuction.step.customizePool.poolOwner.description')}
      </Text>
      <Flex
        backgroundColor="$surface2"
        borderWidth={1}
        borderColor={hasError ? '$statusCritical' : '$surface3'}
        borderRadius="$rounded16"
        p="$spacing16"
        mt="$spacing8"
      >
        <Text variant="body4" color="$neutral2" pb="$spacing4">
          {t('toucan.createAuction.step.customizePool.poolOwner.address')}
        </Text>
        <Trace logFocus element={ElementName.AuctionOwnerAddress}>
          <Input
            value={value}
            onChangeText={onValueChange}
            onBlur={() => setTouched(true)}
            placeholder={activeAddress ?? ''}
            placeholderTextColor="$neutral3"
            height={fonts.subheading2.lineHeight}
            fontSize={fonts.subheading2.fontSize}
            lineHeight={fonts.subheading2.lineHeight}
            fontWeight={fonts.subheading2.fontWeight}
            color="$neutral1"
            px="$none"
            backgroundColor="$transparent"
          />
        </Trace>
      </Flex>
      {hasError && (
        <Text variant="body4" color="$statusCritical" textAlign="center" pt="$spacing4">
          {t('toucan.createAuction.invalidAddressError')}
        </Text>
      )}
    </Flex>
  )
}
