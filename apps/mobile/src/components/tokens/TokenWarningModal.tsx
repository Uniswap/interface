import React from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { LearnMoreLink } from 'src/components/text/LearnMoreLink'
import { getTokenSafetyHeaderText } from 'src/components/tokens/utils'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useTokenSafetyLevelColors } from 'src/features/tokens/safetyHooks'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes, imageSizes, opacify, ThemeNames } from 'ui/src/theme'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'

function getTokenSafetyBodyText(safetyLevel: Maybe<SafetyLevel>, t: AppTFunction): string {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return t(
        'This token isn’t traded on leading U.S. centralized exchanges. Always conduct your own research before trading.'
      )
    case SafetyLevel.StrongWarning:
      return t(
        'This token isn’t traded on leading U.S. centralized exchanges or frequently swapped on Uniswap. Always conduct your own research before trading.'
      )
    case SafetyLevel.Blocked:
      return t('You can’t trade this token using the Uniswap Wallet.')
    default:
      return ''
  }
}

interface Props {
  isVisible: boolean
  currencyId: string
  safetyLevel: Maybe<SafetyLevel>
  disableAccept?: boolean // only show message and close button
  tokenLogoUrl: Maybe<string>
  onClose: () => void
  onAccept: () => void
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  safetyLevel,
  disableAccept,
  tokenLogoUrl,
  onClose,
  onAccept,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const warningColor = useTokenSafetyLevelColors(safetyLevel)

  // always hide accept button if blocked token
  const hideAcceptButton = disableAccept || safetyLevel === SafetyLevel.Blocked

  const closeButtonText = hideAcceptButton ? t('Close') : t('Back')

  const showWarningIcon =
    safetyLevel === SafetyLevel.StrongWarning || safetyLevel === SafetyLevel.Blocked

  if (!isVisible) return null

  return (
    <BottomSheetModal name={ModalName.TokenWarningModal} onClose={onClose}>
      <Flex centered gap="$spacing16" p="$spacing12">
        {showWarningIcon ? (
          <Flex centered gap="$spacing16">
            <Flex
              centered
              borderRadius="$rounded12"
              p="$spacing12"
              style={{
                backgroundColor: opacify(12, colors[warningColor].val),
              }}>
              <WarningIcon safetyLevel={safetyLevel} width={iconSizes.icon24} />
            </Flex>
            <Text variant="subheading1">{getTokenSafetyHeaderText(safetyLevel, t)}</Text>
          </Flex>
        ) : (
          <TokenLogo size={imageSizes.image48} url={tokenLogoUrl} />
        )}
        <Flex centered gap="$spacing12" width="90%">
          <Text color="$neutral2" textAlign="center" variant="body2">
            {getTokenSafetyBodyText(safetyLevel, t)}{' '}
          </Text>
          <LearnMoreLink url={uniswapUrls.helpArticleUrls.tokenWarning} />
        </Flex>
        <Flex centered row gap="$spacing16" mt="$spacing16">
          <Button fill testID={ElementName.Cancel} theme="tertiary" onPress={onClose}>
            {closeButtonText}
          </Button>
          {!hideAcceptButton && (
            <Button
              fill
              testID={ElementName.TokenWarningAccept}
              theme={getButtonTheme(safetyLevel)}
              onPress={onAccept}>
              {showWarningIcon ? t('I understand') : t('Continue')}
            </Button>
          )}
        </Flex>
      </Flex>
    </BottomSheetModal>
  )
}

function getButtonTheme(safetyLevel: Maybe<SafetyLevel>): ThemeNames | undefined {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return 'secondary'
    case SafetyLevel.StrongWarning:
      return 'detrimental'
    default:
      return undefined
  }
}
