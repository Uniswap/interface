import React, { ComponentProps } from 'react'
import ExternalLinkIcon from 'src/assets/icons/external-link.svg'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openUri } from 'src/utils/linking'

interface LinkButtonProps extends Omit<ComponentProps<typeof TextButton>, 'onPress'> {
  label: string
  url: string
}

export function LinkButton({ url, label, textVariant, ...rest }: LinkButtonProps) {
  return (
    <Button onPress={() => openUri(url)} {...rest}>
      <Flex row alignItems="center" gap="xs">
        <Text variant={textVariant}>{label}</Text>
        <ExternalLinkIcon height={14} width={14} />
      </Flex>
    </Button>
  )
}
