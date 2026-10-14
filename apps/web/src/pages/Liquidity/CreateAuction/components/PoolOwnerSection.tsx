import { Flex, fonts, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { shortenAddress } from 'utilities/src/addresses'
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
  // A full 42-char address placeholder clips on mWeb; the shortened form matches the design.
  const isMobile = useMedia().md
  const placeholder = activeAddress && isMobile ? shortenAddress({ address: activeAddress }) : (activeAddress ?? '')

  return (
    <Flex gap="$spacing4">
      <Text variant="subheading1" $md={{ variant: 'subheading2' }} color="$neutral1">
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
        $md={{ p: '$spacing12' }}
      >
        <Text variant="body4" color="$neutral2" pb="$spacing4">
          {t('toucan.createAuction.step.customizePool.poolOwner.address')}
        </Text>
        <Trace logFocus element={ElementName.AuctionOwnerAddress}>
          <Input
            value={value}
            onChangeText={onValueChange}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
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
