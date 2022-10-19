import { TFunction } from 'i18next'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { IconButton } from 'src/components/buttons/IconButton'
import { CloseIcon } from 'src/components/icons/CloseIcon'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { getTokenWarningHeaderText } from 'src/components/tokens/utils'
import WarningIcon from 'src/components/tokens/WarningIcon'
import {
  TokenWarningLevel,
  useTokenWarningLevelColors,
} from 'src/features/tokens/useTokenWarningLevel'
import { opacify } from 'src/utils/colors'

function getBodyText(tokenWarningLevel: TokenWarningLevel, t: TFunction) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
    case TokenWarningLevel.MEDIUM:
      return `${t('This token isn’t verified')}. ${t(
        'Please do your own research before trading.'
      )}`
    case TokenWarningLevel.BLOCKED:
      return t('You can’t trade this token using Uniswap Wallet.')
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
      style={{ backgroundColor: opacify(10, theme.colors[warningColor]) }}>
      <Flex row justifyContent="space-between">
        <Flex alignItems="center" flexDirection="row" gap="xs">
          <WarningIcon height={18} tokenWarningLevel={tokenWarningLevel} width={18} />
          <Text color={warningColor} variant="buttonLabelSmall">
            {getTokenWarningHeaderText(tokenWarningLevel, t)}
          </Text>
        </Flex>
        {tokenWarningLevel !== TokenWarningLevel.BLOCKED && (
          <IconButton
            alignItems="center"
            borderRadius="full"
            height={18}
            icon={<CloseIcon size={8} />}
            justifyContent="center"
            style={{ backgroundColor: opacify(5, theme.colors.white) }}
            width={18}
            onPress={onDismiss}
          />
        )}
      </Flex>
      <Flex>
        <Text color="textSecondary" variant="bodySmall">
          {getBodyText(tokenWarningLevel, t)}
        </Text>
      </Flex>
    </Flex>
  )
}
