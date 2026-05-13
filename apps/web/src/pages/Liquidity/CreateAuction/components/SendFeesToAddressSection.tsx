import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text } from 'ui/src'
import { fonts } from 'ui/src/theme/fonts'
import { isAddress } from '~/chains/utilities'

export function SendFeesToAddressSection({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const [isFocused, setIsFocused] = useState(false)

  const hasError = !isFocused && value !== '' && !isAddress(value)

  return (
    <Flex gap="$spacing8">
      <Flex row alignItems="center" gap="$spacing16" flexWrap="nowrap">
        <Flex flex={1} flexShrink={1} minWidth={0}>
          <Text variant="buttonLabel3" color="$neutral1" height={20} lineHeight={20}>
            {t('toucan.createAuction.step.customizePool.feeClaim')}
          </Text>
          <Text variant="body4" color="$neutral2">
            {t('toucan.createAuction.step.customizePool.feeClaim.description')}
          </Text>
        </Flex>
        <Flex flexShrink={0} width={280} gap="$spacing4">
          <Flex
            row
            alignItems="center"
            height={32}
            px="$spacing16"
            backgroundColor="$surface2"
            borderWidth={hasError ? 1 : 0}
            borderColor={hasError ? '$statusCritical' : '$surface3'}
            borderRadius="$rounded16"
            overflow="hidden"
          >
            <Input
              flex={1}
              value={value}
              onChangeText={onValueChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={t('toucan.createAuction.step.customizePool.feeClaim.inputPlaceholder')}
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
