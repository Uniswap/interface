import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import ExternalLinkIcon from 'src/assets/icons/external-link.svg'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { iconSizes } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'

interface LinkButtonProps extends Omit<ComponentProps<typeof TextButton>, 'onPress'> {
  label: string
  url: string
  isSafeUri?: boolean
  color?: keyof Theme['colors']
  size?: number
}

export function LinkButton({
  url,
  label,
  textVariant,
  color,
  isSafeUri = false,
  size = iconSizes.sm,
  ...rest
}: LinkButtonProps) {
  const theme = useAppTheme()
  const iconColor = color ? theme.colors[color] : theme.colors.textSecondary

  return (
    <Button onPress={() => openUri(url, isSafeUri)} {...rest}>
      <Flex centered row gap="xxs">
        <Text color={color} variant={textVariant}>
          {label}
        </Text>
        <ExternalLinkIcon fill={iconColor} height={size} width={size} />
      </Flex>
    </Button>
  )
}
