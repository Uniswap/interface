import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { Flex, Text } from 'ui/src'
import { Signature } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'

interface SignatureMessageSectionProps {
  message: string
  maxHeight?: number
}

const SCROLL_VIEW_CONTENT_STYLE = {
  paddingHorizontal: spacing.spacing16,
  paddingBottom: spacing.spacing12,
}

/**
 * Displays a signature message in a scrollable container
 * Shows error state for non-decodable messages
 */
export function SignatureMessageSection({ message, maxHeight = 200 }: SignatureMessageSectionProps): JSX.Element {
  const { t } = useTranslation()

  const scrollViewStyle = useMemo(() => ({ maxHeight }), [maxHeight])

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
          <Text color="$neutral1" variant="monospace">
            {message}
          </Text>
        </ScrollView>
      </Flex>
    </Flex>
  )
}
