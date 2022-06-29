import { useNavigation } from '@react-navigation/native'
import { SpacingProps, SpacingShorthandProps, useTheme } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/buttons/Button'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type Props = {
  size?: number
  color?: keyof Theme['colors']
  showButtonLabel?: boolean
  onPressBack?: () => void
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackButton({ onPressBack, size, color, showButtonLabel, ...rest }: Props) {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  const goBack = onPressBack ? onPressBack : () => navigation.goBack()

  return (
    <Button onPress={goBack} {...rest}>
      <Flex row alignItems="center" gap="xs">
        <Chevron
          color={color ? theme.colors[color] : theme.colors.textSecondary}
          direction="w"
          height={size ?? 18}
          width={size ?? 18}
        />
        {showButtonLabel && (
          <Text color="textSecondary" variant={'subhead'}>
            {t('Back')}
          </Text>
        )}
      </Flex>
    </Button>
  )
}
