import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text } from 'ui/src'
import { Clear, Signature } from 'ui/src/components/icons'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

interface NonStandardTypedDataContentProps {
  typedData: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/**
 * Content for non-standard typed data signatures
 * Shows decode error and raw message with warning that requires acknowledgment
 */
export function NonStandardTypedDataContent({
  typedData,
  checked,
  onCheckedChange,
}: NonStandardTypedDataContentProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing16">
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        flexDirection="column"
        gap="$spacing12"
        pt="$spacing12"
        pb="$spacing12"
        overflow="hidden"
      >
        <Flex row px="$spacing12" gap="$spacing8" alignItems="center">
          <Clear color="$neutral2" size="$icon.16" />
          <Text variant="body3" color="$neutral2">
            {t('dapp.request.signature.decodeError')}
          </Text>
        </Flex>
        <Separator />
        <Flex maxHeight={150} $platform-web={{ overflowY: 'auto' }} px="$spacing16" gap="$spacing8">
          <Flex row gap="$spacing8" alignItems="center">
            <Signature color="$neutral2" size="$icon.16" />
            <Text variant="body3" color="$neutral2">
              {t('common.message')}
            </Text>
          </Flex>
          <Text variant="body3" color="$neutral1">
            {typedData}
          </Text>
        </Flex>
      </Flex>
      <InlineWarningCard
        hideCtaIcon
        severity={WarningSeverity.Medium}
        heading={t('dapp.request.signature.irregular')}
        description={t('dapp.request.signature.irregular.description')}
        checkboxLabel={t('dapp.request.signature.irregular.understand')}
        checked={checked}
        setChecked={onCheckedChange}
      />
    </Flex>
  )
}
