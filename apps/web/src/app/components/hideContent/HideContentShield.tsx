import { useTranslation } from 'react-i18next'
import { ColorTokens, getTokenValue, Icons } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'

export function HideContentShield({
  color,
  visibility,
  onShowContent,
}: {
  color: ColorTokens
  visibility: boolean
  onShowContent: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      alignItems="center"
      backgroundColor={color}
      borderRadius="$rounded16"
      gap="$spacing24"
      height="100%"
      justifyContent="center"
      opacity={visibility ? 0 : 1}
      position="absolute"
      width="100%">
      <Icons.EyeOff color="$neutral2" size={getTokenValue('$icon.64')} />
      <Button
        backgroundColor="$surface2"
        borderRadius="$rounded12"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing8"
        onPress={onShowContent}>
        {t('Reveal')}
      </Button>
    </Flex>
  )
}
