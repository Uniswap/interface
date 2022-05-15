import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import XOctagon from 'src/assets/icons/x-octagon.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { CloseIcon } from 'src/components/icons/CloseIcon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import { Theme } from 'src/styles/theme'
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

function getColors(
  tokenWarningLevel: TokenWarningLevel,
  theme: Theme
): [string, keyof Theme['colors']] {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return [theme.colors.deprecated_yellow, 'deprecated_yellow']
    case TokenWarningLevel.MEDIUM:
      return [theme.colors.deprecated_red, 'deprecated_red']
    case TokenWarningLevel.BLOCKED:
      return [theme.colors.deprecated_gray400, 'deprecated_gray400']
    default:
      return [theme.colors.deprecated_gray400, 'deprecated_gray400']
  }
}

export default function TokenWarningCard({
  tokenWarningLevel,
  onDismiss,
}: {
  tokenWarningLevel: TokenWarningLevel
  onDismiss?: () => void
}) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const [backgroundColor, mainColor] = getColors(tokenWarningLevel, theme)

  return (
    <Flex
      borderColor={mainColor}
      borderRadius="lg"
      borderWidth={1}
      gap="sm"
      padding="md"
      style={{ backgroundColor: opacify(16, backgroundColor) }}>
      <Flex row justifyContent="space-between">
        <Flex alignItems="center" flexDirection="row" gap="xs">
          {tokenWarningLevel === TokenWarningLevel.BLOCKED ? (
            <XOctagon color={backgroundColor} />
          ) : (
            <AlertTriangle color={backgroundColor} />
          )}
          <Text color={mainColor} variant="body1">
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
            style={{ backgroundColor: opacify(40, backgroundColor) }}
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
