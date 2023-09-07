import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ColorTokens, Icons } from 'ui/src'

type Props = {
  size?: number
  color?: ColorTokens
  showButtonLabel?: boolean
}

export function BackButtonView({ size, color, showButtonLabel }: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="spacing8">
      <Icons.RotatableChevron color={color ?? '$neutral2'} height={size} width={size} />
      {showButtonLabel && (
        <Text color="neutral2" variant="subheadLarge">
          {t('Back')}
        </Text>
      )}
    </Flex>
  )
}
