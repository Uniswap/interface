/**
 * @deprecated
 *
 * TODO(WALL-4677): remove this file
 */
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, isWeb } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { imageSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import {
  getWarningButtonProps,
  getWarningIconColors,
  safetyLevelToWarningSeverity,
} from 'uniswap/src/components/warnings/utils'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { getTokenSafetyHeaderText } from 'uniswap/src/features/tokens/deprecatedSafetyUtils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

function getTokenSafetyBodyText(safetyLevel: Maybe<SafetyLevel>, t: AppTFunction): string {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return t('token.safetyLevel.medium.message')
    case SafetyLevel.StrongWarning:
      return t('token.safetyLevel.strong.message')
    case SafetyLevel.Blocked:
      return t('token.safetyLevel.blocked.message')
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
 * @deprecated Use TokenWarningModal instead
 */
export default function DeprecatedTokenWarningModal({
  isVisible,
  safetyLevel,
  disableAccept,
  tokenLogoUrl,
  onClose,
  onAccept,
}: Props): JSX.Element | null {
  const { t } = useTranslation()
  const severity = safetyLevelToWarningSeverity(safetyLevel)
  const { backgroundColor: warningIconBackgroundColor, textColor } = getWarningIconColors(severity)
  const { buttonTextColor, theme } = getWarningButtonProps(severity)

  // always hide accept button if blocked token
  const hideAcceptButton = disableAccept || safetyLevel === SafetyLevel.Blocked

  const closeButtonText = hideAcceptButton ? t('common.button.close') : t('common.button.back')

  const showWarningIcon = safetyLevel === SafetyLevel.StrongWarning || safetyLevel === SafetyLevel.Blocked

  return (
    <Modal isModalOpen={isVisible} maxWidth={420} name={ModalName.TokenWarningModal} onClose={onClose}>
      <Flex
        centered
        gap="$spacing16"
        pb={isWeb ? '$none' : '$spacing12'}
        pt="$spacing12"
        px={isWeb ? '$none' : '$spacing24'}
      >
        {showWarningIcon ? (
          <Flex centered gap="$spacing16">
            <Flex centered borderRadius="$rounded12" p="$spacing12" backgroundColor={warningIconBackgroundColor}>
              <WarningIcon safetyLevel={safetyLevel} size="$icon.24" />
            </Flex>
            <Text color={textColor} variant="subheading1">
              {getTokenSafetyHeaderText(safetyLevel, t)}
            </Text>
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
        <Flex centered row gap="$spacing12" mt="$spacing16" width="100%">
          <Button flex={1} flexBasis={1} testID={TestID.Cancel} theme="tertiary" onPress={onClose}>
            {closeButtonText}
          </Button>
          {!hideAcceptButton && (
            <Button
              color={buttonTextColor}
              flex={1}
              flexBasis={1}
              testID={TestID.TokenWarningAccept}
              theme={theme}
              onPress={onAccept}
            >
              {showWarningIcon ? t('common.button.understand') : t('common.button.continue')}
            </Button>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
