import { useTranslation } from 'react-i18next'
import { Flex, Input, Text } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { fonts } from 'ui/src/theme'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export function TokenAdditionalInfoSection({
  description,
  onDescriptionChange,
}: {
  description: string
  onDescriptionChange: (v: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing8">
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing2" minHeight={120}>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.descriptionField')}
        </Text>
        <Input
          flex={1}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={t('toucan.createAuction.step.tokenInfo.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
          unstyled
          fontFamily="$body"
          fontSize={fonts.body1.fontSize}
          lineHeight={fonts.body1.lineHeight}
          fontWeight={fonts.body1.fontWeight}
          color="$neutral1"
          placeholderTextColor="$neutral3"
        />
      </Flex>
      <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing12">
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.tokenInfo.xProfile')}
          </Text>
          <Text variant="body3" color="$neutral3">
            {t('toucan.createAuction.step.tokenInfo.optional')}
          </Text>
          <QuestionInCircleFilled color="$neutral2" size="$icon.16" />
        </Flex>
        <Flex
          row
          alignItems="center"
          justifyContent="center"
          backgroundColor="$surface3"
          borderRadius="$rounded16"
          py="$spacing12"
          px="$spacing16"
          gap="$spacing8"
          onPress={() => {}} // TODO: launch X OAuth flow
          {...ClickableTamaguiStyle}
        >
          <XTwitter color="$neutral1" size="$icon.24" />
          <Text variant="buttonLabel2" color="$neutral1">
            {t('toucan.createAuction.step.tokenInfo.xProfile.connect')}
          </Text>
          <ExternalLink color="$neutral1" size="$icon.20" />
        </Flex>
      </Flex>
    </Flex>
  )
}
