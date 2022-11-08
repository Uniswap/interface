import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { GQLNftAsset } from 'src/features/nfts/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { formatNumber, NumberType } from 'src/utils/format'

export function NFTCollectionModal({
  collection,
  isVisible,
  onClose,
}: {
  collection: NonNullable<NonNullable<GQLNftAsset>['collection']>
  isVisible: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const traceProps = useMemo(() => {
    return { address: collection.collectionId }
  }, [collection.collectionId])

  const stats = collection.markets?.[0]

  return (
    <BottomSheetModal
      isVisible={isVisible}
      name={ModalName.NftCollection}
      properties={traceProps}
      onClose={onClose}>
      <Screen bg="background1" edges={['bottom']} pt="xs" px="lg">
        <Flex gap="sm">
          {/* Collection image and name */}
          <Flex alignItems="center" gap="sm">
            {collection.image?.url && (
              <Box borderRadius="full" height={60} overflow="hidden" width={60}>
                <NFTViewer uri={collection.image.url} />
              </Box>
            )}
            <Flex centered row gap="xxs">
              <Box flexShrink={1}>
                <Text color="textPrimary" variant="subheadLarge">
                  {collection.name}{' '}
                  {collection.isVerified && (
                    <Box pt="xxs">
                      <VerifiedIcon color={theme.colors.userThemeMagenta} height={22} width={22} />
                    </Box>
                  )}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Flex>

        {/* Collection stats */}
        <Flex row gap="xxs" justifyContent="space-between" py="md">
          <Flex fill alignItems="center" gap="xxs">
            <Text color="textTertiary" variant="subheadSmall">
              {t('Items')}
            </Text>
            <Text variant="bodyLarge">
              {formatNumber(collection.numAssets, NumberType.NFTCollectionStats)}
            </Text>
          </Flex>
          <Flex fill alignItems="center" gap="xxs">
            <Text color="textTertiary" variant="subheadSmall">
              {t('Owners')}
            </Text>
            <Text variant="bodyLarge">
              {formatNumber(stats?.owners, NumberType.NFTCollectionStats)}
            </Text>
          </Flex>
          {stats?.floorPrice && (
            <Flex fill alignItems="center" gap="xxs">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Floor')}
              </Text>
              <Text variant="bodyLarge">
                {`${formatNumber(stats?.floorPrice?.value, NumberType.NFTTokenFloorPrice)} ${
                  stats?.floorPrice?.value !== undefined ? 'ETH' : ''
                }`}
              </Text>
            </Flex>
          )}
          {stats?.totalVolume && (
            <Flex fill alignItems="center" gap="xxs">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Volume')}
              </Text>
              <Text variant="bodyLarge">
                {formatNumber(stats?.totalVolume?.value, NumberType.NFTCollectionStats)}
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Collection description */}
        {collection?.description && (
          <LongText
            renderAsMarkdown
            color="textPrimary"
            initialDisplayedLines={20}
            text={collection?.description}
          />
        )}
      </Screen>
    </BottomSheetModal>
  )
}
