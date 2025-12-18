import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Signature } from 'ui/src/components/icons'
import { fonts, spacing } from 'ui/src/theme'
import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { isWebPlatform } from 'utilities/src/platform'
import { useCopyToClipboard } from 'wallet/src/components/copy/useCopyToClipboard'

interface SignatureMessageSectionProps {
  message: string
  isDecoded?: boolean
  maxHeight?: number
}

const SCROLL_VIEW_CONTENT_STYLE = {
  paddingHorizontal: spacing.spacing16,
  paddingBottom: spacing.spacing12,
}

/**
 * Displays a signature message in a scrollable container
 * Shows error state for non-decodable messages
 * Enables copy-to-clipboard for raw (non-decoded) messages
 */
export function SignatureMessageSection({
  message,
  isDecoded = true,
  maxHeight = 200,
}: SignatureMessageSectionProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const copyToClipboard = useCopyToClipboard()

  const scrollViewStyle = useMemo(() => ({ maxHeight }), [maxHeight])

  const textInputStyle = useMemo(
    () => ({
      fontFamily: fonts.monospace.family,
      fontSize: fonts.monospace.fontSize,
      lineHeight: fonts.monospace.lineHeight,
      color: colors.neutral1.val,
      padding: 0,
    }),
    [colors.neutral1.val],
  )

  const handleCopyMessage = useCallback(async () => {
    await copyToClipboard({
      textToCopy: message,
      copyType: CopyNotificationType.Message,
    })
  }, [message, copyToClipboard])

  // Render message content with optional copy functionality for raw data
  // Use Text for both platforms when not decoded to allow TouchableArea to capture taps
  const messageContent =
    isWebPlatform || !isDecoded ? (
      <Text color="$neutral1" variant="monospace" userSelect="text">
        {message}
      </Text>
    ) : (
      <TextInput value={message} editable={false} multiline={true} style={textInputStyle} scrollEnabled={false} />
    )

  return (
    <Flex gap="$spacing12">
      {/* Message label */}
      <Flex row gap="$spacing8" height={20} alignItems="center" px="$spacing16">
        <Signature color="$neutral2" size="$icon.12" />
        <Text color="$neutral2" variant="body3">
          {t('common.message')}
        </Text>
      </Flex>

      {/* Scrollable message content */}
      <Flex mb={-spacing.spacing12}>
        <ScrollView
          $platform-web={{ overflowY: 'auto' }}
          style={scrollViewStyle}
          contentContainerStyle={SCROLL_VIEW_CONTENT_STYLE}
          showsVerticalScrollIndicator={true}
        >
          {!isDecoded ? <TouchableArea onPress={handleCopyMessage}>{messageContent}</TouchableArea> : messageContent}
        </ScrollView>
      </Flex>
    </Flex>
  )
}
