import { useTranslation } from 'react-i18next'
import { Icons } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { colorsDark } from 'ui/src/theme/color'

export function HideContentShield({
  color,
  visibility,
  onShowContent,
}: {
  color: string
  visibility: boolean
  onShowContent: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      alignItems="center"
      backgroundColor={color}
      borderRadius="$rounded16"
      gap="$spacing16"
      height="100%"
      justifyContent="center"
      opacity={visibility ? 0 : 1}
      position="absolute"
      width="100%">
      <Icons.EyeOff color={colorsDark.textSecondary} size="$icon.64" />
      <Button
        backgroundColor={colorsDark.background3}
        borderRadius="$rounded12"
        paddingHorizontal="$spacing12"
        paddingVertical="$spacing4"
        onPress={onShowContent}>
        {t('Reveal')}
      </Button>
    </Flex>
  )
}
