import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Switch, Text } from 'ui/src'
import { fonts } from 'ui/src/theme/fonts'
import { isAddress } from '~/chains/utilities'

export function SendFeesToAddressSection({
  enabled,
  onEnabledChange,
  value,
  onValueChange,
  placeholderAddress,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  value: string
  onValueChange: (value: string) => void
  placeholderAddress: string
}) {
  const { t } = useTranslation()
  const [touched, setTouched] = useState(false)

  const hasError = touched && value !== '' && !isAddress(value)

  return (
    <Flex gap="$spacing12">
      <Flex row alignItems="flex-start" justifyContent="space-between" gap="$spacing12">
        <Flex flex={1}>
          <Text variant="subheading1" color="$neutral1">
            {t('toucan.createAuction.step.customizePool.sendFees')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.customizePool.sendFees.description')}
          </Text>
        </Flex>
        <Switch checked={enabled} variant="default" onCheckedChange={onEnabledChange} />
      </Flex>
      {enabled && (
        <Flex>
          <Flex
            backgroundColor="$surface2"
            borderWidth={1}
            borderColor={hasError ? '$statusCritical' : '$surface3'}
            borderRadius="$rounded16"
            p="$spacing16"
          >
            <Text variant="body4" color="$neutral2" pb="$spacing4">
              {t('toucan.createAuction.step.customizePool.sendFees.recipientAddress')}
            </Text>
            <Input
              value={value}
              onChangeText={onValueChange}
              onBlur={() => setTouched(true)}
              placeholder={placeholderAddress}
              placeholderTextColor="$neutral3"
              height={fonts.subheading2.lineHeight}
              fontSize={fonts.subheading2.fontSize}
              lineHeight={fonts.subheading2.lineHeight}
              fontWeight={fonts.subheading2.fontWeight}
              color="$neutral1"
              px="$none"
              backgroundColor="$transparent"
            />
          </Flex>
          {hasError && (
            <Text variant="body4" color="$statusCritical" textAlign="center" pt="$spacing4">
              {t('toucan.createAuction.invalidAddressError')}
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  )
}
