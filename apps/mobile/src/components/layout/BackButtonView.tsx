import React from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'

type Props = {
  size?: number
  color?: ColorTokens
  showButtonLabel?: boolean
}

export function BackButtonView({ size, color, showButtonLabel }: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing8">
      <RotatableChevron color={color ?? '$neutral2'} height={size} width={size} />
      {showButtonLabel && (
        <Text color="$neutral2" variant="subheading1">
          {t('common.button.back')}
        </Text>
      )}
    </Flex>
  )
}
