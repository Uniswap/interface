import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { uniswapUrls } from 'src/constants/urls'
import { NftItemScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { ModalName } from 'src/features/telemetry/constants'
import { formatNumber, NumberType } from 'src/utils/format'
import { logger } from 'src/utils/logger'

export function NFTCollectionModal({
  collection,
  onClose,
}: {
  collection: NonNullable<
    NonNullable<
      NonNullable<NonNullable<NonNullable<NftItemScreenQuery['nftAssets']>['edges']>[0]>['node']
    >['collection']
  >
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const traceProps = useMemo(() => {
    return { address: collection.collectionId }
  }, [collection.collectionId])

  const stats = collection.markets?.[0]

  const onShare = useCallback(async () => {
    const address = collection.nftContracts?.[0]?.address
    if (!address) return

    try {
      await Share.share({
        message: `${uniswapUrls.nftUrl}/collection/${address}`,
      })
    } catch (e) {
      logger.error('NFTCollectionModal', 'onShare', (e as unknown as Error).message)
    }
  }, [collection.nftContracts])

  return (
    <BottomSheetModal name={ModalName.NftCollection} properties={traceProps} onClose={onClose}>
      <Screen bg="background1" edges={['bottom']} pt="spacing8" px="spacing24">
        <Flex>
          <Flex gap="spacing12">
            {/* Collection image and name */}
            <Flex alignItems="center" gap="spacing12">
              {collection.image?.url && (
                <Box borderRadius="roundedFull" height={60} overflow="hidden" width={60}>
                  <NFTViewer squareGridView maxHeight={60} uri={collection.image.url} />
                </Box>
              )}
              <Flex centered row gap="spacing4">
                <Box flexShrink={1}>
                  <Text color="textPrimary" variant="subheadLarge">
                    {collection.name}{' '}
                    {collection.isVerified && (
                      <Box pt="spacing2">
                        <VerifiedIcon
                          color={theme.colors.userThemeMagenta}
                          height={theme.iconSizes.icon16}
                          width={theme.iconSizes.icon16}
                        />
                      </Box>
                    )}
                  </Text>
                </Box>
              </Flex>
            </Flex>
          </Flex>

          {/* Collection stats */}
          <Flex row gap="spacing4" justifyContent="space-between">
            <Flex fill alignItems="center" gap="spacing4">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Items')}
              </Text>
              <Text variant="bodyLarge">
                {formatNumber(collection.numAssets, NumberType.NFTCollectionStats)}
              </Text>
            </Flex>
            <Flex fill alignItems="center" gap="spacing4">
              <Text color="textTertiary" variant="subheadSmall">
                {t('Owners')}
              </Text>
              <Text variant="bodyLarge">
                {formatNumber(stats?.owners, NumberType.NFTCollectionStats)}
              </Text>
            </Flex>
            {stats?.floorPrice && (
              <Flex fill alignItems="center" gap="spacing4">
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
              <Flex fill alignItems="center" gap="spacing4">
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
            <LongText renderAsMarkdown initialDisplayedLines={20} text={collection?.description} />
          )}

          <Button
            fill
            emphasis={ButtonEmphasis.Secondary}
            label={t('Share collection')}
            onPress={onShare}
          />
        </Flex>
      </Screen>
    </BottomSheetModal>
  )
}
