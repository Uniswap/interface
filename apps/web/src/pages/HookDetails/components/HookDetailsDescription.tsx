import { Flex, Text } from '@universe/mycelium'
import { Sparkle } from '@universe/mycelium/icons/Sparkle'
import { useTranslation } from 'react-i18next'

export function HookDetailsDescription({
  description,
  descriptionGeneratedByAi,
}: {
  description: string
  descriptionGeneratedByAi: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const text = description.trim()

  return (
    <Flex gap="$gap8">
      <Text variant="body3" color="$neutral2" wordBreak="break-word">
        {text || t('hooks.details.noDescription')}
      </Text>
      {text && descriptionGeneratedByAi && (
        <Flex row alignItems="center" gap="$gap4">
          <Sparkle size={12} color="$neutral3" />
          <Text variant="body4" color="$neutral3">
            {t('hook.description.generatedByAi')}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
