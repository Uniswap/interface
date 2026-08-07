import { useTranslation } from 'react-i18next'
import { Flex, SpinningLoader, Text, styled } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

const LoadingIndicatorContainer = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'center',
  mt: -48,
  zIndex: zIndexes.sticky,
  '$platform-web': {
    position: 'sticky',
  },
})

const LoadingIndicator = styled(Flex, {
  row: true,
  alignItems: 'center',
  backgroundColor: '$accent2Solid',
  borderRadius: '$rounded8',
  width: 'fit-content',
  p: '$padding8',
  gap: '$gap8',
  height: 34,
})

type TableLoadMoreIndicatorProps = {
  loadingMore: boolean
}

export function TableLoadMoreIndicator({ loadingMore }: TableLoadMoreIndicatorProps): JSX.Element | null {
  const { t } = useTranslation()

  if (!loadingMore) {
    return null
  }

  return (
    <LoadingIndicatorContainer>
      <LoadingIndicator>
        <SpinningLoader size={16} color="$accent1" unstyled />
        <Text variant="body3" color="$accent1">
          {t('common.loading')}
        </Text>
      </LoadingIndicator>
    </LoadingIndicatorContainer>
  )
}
