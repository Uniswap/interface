import { Button, Flex, Text, zIndexes } from '@universe/mycelium'
import { ChartBarCrossed } from '@universe/mycelium/icons/ChartBarCrossed'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'

export function ChartBarCrossedWithBackground(): JSX.Element {
  return (
    <Flex padding="$padding8" backgroundColor="$surface3" borderRadius="$rounded12">
      <ChartBarCrossed size="$icon.20" color="$neutral2" />
    </Flex>
  )
}

export const ErrorModal = ({
  header,
  subtitle,
  onRetry,
  retryText,
}: {
  header: React.ReactNode
  subtitle: React.ReactNode
  onRetry?: () => void
  retryText?: string
}) => {
  const { t } = useTranslation()
  return (
    <Flex
      row
      testID={TestID.TableErrorModal}
      alignItems="flex-start"
      justifyContent="flex-start"
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      // Sit above sticky pinned cells (zIndexes.default) so they can't paint over or intercept the retry button
      zIndex={zIndexes.mask}
      width={320}
      padding="$padding12"
      gap="$gap12"
      backgroundColor="$surface5"
      backdropFilter="blur(24px)"
      boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
    >
      <Flex>
        <ChartBarCrossedWithBackground />
      </Flex>
      <Flex maxWidth={200} gap="$gap8">
        <Flex>
          <Text variant="subheading2" color="$neutral1">
            {header}
          </Text>
          <Text variant="body3" color="$neutral2">
            {subtitle}
          </Text>
        </Flex>
        {onRetry && (
          <Button variant="default" size="medium" onPress={onRetry}>
            {retryText ?? t('common.button.retry')}
          </Button>
        )}
      </Flex>
    </Flex>
  )
}
