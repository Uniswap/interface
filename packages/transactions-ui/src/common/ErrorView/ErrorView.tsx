import { Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { opacify, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { ERROR_VIEW_STYLES } from '@universe/transactions-ui/src/common/ErrorView/errorViewStyles'
import { useTranslation } from 'react-i18next'

export interface ErrorViewAction {
  label: string
  onPress: () => void
}

export interface ErrorViewProps {
  /** Product copy, from getErrorContent today. */
  title: string
  message: string
  /** e.g. "Try again", or error-specific recovery copy. */
  primaryAction: ErrorViewAction
  /** Shows "Learn more" under the message. The host opens the article. */
  onPressLearnMore?: () => void
  testID?: string
}

/**
 * A failed transaction step: icon, title, message, optional "Learn more", one recovery
 * button. Replaces SwapErrorScreen's markup and the slice of WarningModalContent it uses.
 *
 * Content only. The "Get help" and close buttons above it are modal chrome (ModalShell,
 * later), and the enter fade runs on Reanimated, so both stay in the adapter, where they
 * are today.
 *
 * @alias ErrorScreen, TransactionError, FailedStepView, ErrorState
 */
export function ErrorView({ title, message, primaryAction, onPressLearnMore, testID }: ErrorViewProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const messageText = (
    <Text color="$neutral2" textAlign="center" variant="body3">
      {message}
    </Text>
  )

  return (
    <Flex
      centered
      gap="$spacing12"
      pb={ERROR_VIEW_STYLES.paddingBottom}
      pt="$spacing12"
      px={ERROR_VIEW_STYLES.paddingX}
      testID={testID}
    >
      <Flex
        centered
        alignItems="center"
        borderRadius="$rounded12"
        mb="$spacing8"
        minHeight="$spacing48"
        minWidth="$spacing48"
        p="$spacing12"
        style={{ backgroundColor: opacify(12, colors.neutral1.val) }}
      >
        <AlertTriangleFilled color="$neutral1" size="$icon.24" />
      </Flex>
      <Text textAlign="center" variant={ERROR_VIEW_STYLES.titleVariant}>
        {title}
      </Text>
      {onPressLearnMore ? (
        <Flex alignItems="center" gap="$spacing8">
          {messageText}
          {/* No press scale or opacity, like the TouchableTextLink this replaces. */}
          <TouchableArea activeOpacity={0} scaleTo={1} onPress={onPressLearnMore}>
            <Text color="$accent1" hoverStyle={ERROR_VIEW_STYLES.learnMoreHoverStyle} variant="buttonLabel2">
              {t('common.button.learn')}
            </Text>
          </TouchableArea>
        </Flex>
      ) : (
        messageText
      )}
      <Flex row alignSelf="stretch" gap="$spacing12" pt="$spacing24">
        <Button emphasis="secondary" size={ERROR_VIEW_STYLES.buttonSize} onPress={primaryAction.onPress}>
          {primaryAction.label}
        </Button>
      </Flex>
    </Flex>
  )
}
