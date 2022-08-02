import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import ExternalLinkIcon from 'src/assets/icons/external-link.svg'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { openUri } from 'src/utils/linking'

interface LinkButtonProps extends Omit<ComponentProps<typeof TextButton>, 'onPress'> {
  label: string
  url: string
  color?: keyof Theme['colors']
}

export function LinkButton({ url, label, textVariant, color, ...rest }: LinkButtonProps) {
  const theme = useAppTheme()

  return (
    <Button onPress={() => openUri(url)} {...rest}>
      <Flex row alignItems="center" gap="xs">
        <Text color={color} variant={textVariant}>
          {label}
        </Text>
        <ExternalLinkIcon fill={color ? theme.colors[color] : '#99A1BD'} height={14} width={14} />
      </Flex>
    </Button>
  )
}
