import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text } from 'ui/src'

const FOOTER_HEIGHT = 34

export function NftsListLoadingFooter({ show }: { show: boolean }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered height={FOOTER_HEIGHT}>
      {show && (
        <Flex
          row
          centered
          maxWidth="max-content"
          gap="$gap8"
          p="$padding8"
          backgroundColor="$accent2Solid"
          borderRadius="$rounded8"
        >
          <SpinningLoader unstyled size={16} color="$accent1" />
          <Text variant="body3" color="$accent1">
            {t('common.loading')}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
