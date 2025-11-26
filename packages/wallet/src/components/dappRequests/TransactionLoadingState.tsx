import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

const LOADING_STATE_HEIGHT = 116

/**
 * Loading state shown while Blockaid transaction scan is in progress
 * Displays a spinner with "Transaction preview" text
 */
export function TransactionLoadingState(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      backgroundColor="$surface2"
      borderColor="$surface3"
      borderWidth="$spacing1"
      borderRadius="$rounded16"
      height={LOADING_STATE_HEIGHT}
      alignItems="center"
      justifyContent="center"
      pb="$spacing12"
      pt="$spacing16"
    >
      <Flex
        row
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth="$spacing1"
        gap="$spacing4"
        alignItems="center"
        px="$spacing8"
        py="$spacing4"
        borderRadius="$rounded20"
      >
        <SpinningLoader size={iconSizes.icon20} color="$neutral2" />
        <Text color="$neutral2" variant="body3">
          {t('dapp.transaction.preview')}
        </Text>
      </Flex>
    </Flex>
  )
}
