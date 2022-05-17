import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { IconButton } from 'src/components/buttons/IconButton'
import { CloseIcon } from 'src/components/icons/CloseIcon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import WarningIcon from 'src/components/tokens/WarningIcon'
import {
  TokenWarningLevel,
  useTokenWarningLevelColors,
} from 'src/features/tokens/useTokenWarningLevel'
import { opacify } from 'src/utils/colors'

function getHeaderText(tokenWarningLevel: TokenWarningLevel, t: TFunction) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return t('Be careful')
    case TokenWarningLevel.MEDIUM:
      return t('Warning')
    case TokenWarningLevel.BLOCKED:
      return t('Not available for trading')
  }
}

function getBodyText(tokenWarningLevel: TokenWarningLevel, t: TFunction) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return t(
        'This token only appears on one partner token list or has low trade volume. Please research this token using the information and links below.'
      )
    case TokenWarningLevel.MEDIUM:
      return t(
        'This token does not appear on any partner token lists or has very low trade volume. Please research this token using the information and links below.'
      )
    case TokenWarningLevel.BLOCKED:
      return t('This token cannot be traded through the Uniswap mobile app.')
  }
}

export default function TokenWarningCard({
  tokenWarningLevel,
  onDismiss,
}: {
  tokenWarningLevel: TokenWarningLevel
  onDismiss?: () => void
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const warningColor = useTokenWarningLevelColors(tokenWarningLevel)

  return (
    <Flex
      borderColor={warningColor}
      borderRadius="lg"
      borderWidth={1}
      gap="sm"
      padding="md"
      style={{ backgroundColor: opacify(16, theme.colors[warningColor]) }}>
      <Flex row justifyContent="space-between">
        <Flex alignItems="center" flexDirection="row" gap="xs">
          <WarningIcon tokenWarningLevel={tokenWarningLevel} />
          <Text color={warningColor} variant="body1">
            {getHeaderText(tokenWarningLevel, t)}
          </Text>
        </Flex>
        {tokenWarningLevel !== TokenWarningLevel.BLOCKED && (
          <IconButton
            alignItems="center"
            borderRadius="full"
            height={20}
            icon={<CloseIcon size={8} />}
            justifyContent="center"
            style={{ backgroundColor: opacify(40, theme.colors[warningColor]) }}
            width={20}
            onPress={onDismiss}
          />
        )}
      </Flex>
      <Flex>
        <Text color="deprecated_gray600" fontSize={16}>
          {getBodyText(tokenWarningLevel, t)}
        </Text>
      </Flex>
    </Flex>
  )
}
