import { ColorTokens, Flex, Text, type IconSizeTokens } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import React from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  size?: IconSizeTokens
  color?: ColorTokens
  showButtonLabel?: boolean
}

export function BackButtonView({ size, color, showButtonLabel }: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row alignItems="center" gap="$spacing8">
      <RotatableChevron color={color ?? '$neutral2'} size={size} />
      {showButtonLabel && (
        <Text color="$neutral2" variant="subheading1">
          {t('common.button.back')}
        </Text>
      )}
    </Flex>
  )
}
