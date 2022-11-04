import React from 'react'
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
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { formatNFTFloorPrice, formatNumber } from 'src/utils/format'

export function NFTCollectionModal({
  collection,
  isVisible,
  onClose,
}: {
  collection: NonNullable<GQLNftAsset>['collection']
  isVisible: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  // TODO: Add loading state for this modal
  if (!collection) return null

  const stats = collection.markets?.[0]

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.NftCollection} onClose={onClose}>
      <Screen bg="background1" edges={['bottom']} pt="md" px="lg">
        <Trace section={SectionName.NFTCollectionModal}>
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
                        <VerifiedIcon
                          color={theme.colors.userThemeMagenta}
                          height={22}
                          width={22}
                        />
                      </Box>
                    )}
                  </Text>
                </Box>
              </Flex>
            </Flex>

            {/* Collection stats */}
            <Flex row gap="xxs" justifyContent="space-between">
              <Flex fill alignItems="center" gap="xxs">
                <Text color="textTertiary" variant="subheadSmall">
                  {t('Items')}
                </Text>
                {collection?.numAssets && (
                  <Text variant="bodyLarge">{formatNumber(collection.numAssets)}</Text>
                )}
              </Flex>
              <Flex fill alignItems="center" gap="xxs">
                <Text color="textTertiary" variant="subheadSmall">
                  {t('Owners')}
                </Text>
                {stats?.owners && <Text variant="bodyLarge">{formatNumber(stats.owners)}</Text>}
              </Flex>
              {stats?.floorPrice && (
                <Flex fill alignItems="center" gap="xxs">
                  <Text color="textTertiary" variant="subheadSmall">
                    {t('Floor')}
                  </Text>
                  <Text variant="bodyLarge">
                    {t('{{price}} ETH', {
                      price: formatNFTFloorPrice(stats.floorPrice.value),
                    })}
                  </Text>
                </Flex>
              )}
              {stats?.totalVolume && (
                <Flex fill alignItems="center" gap="xxs">
                  <Text color="textTertiary" variant="subheadSmall">
                    {t('Volume')}
                  </Text>
                  <Text variant="bodyLarge">{formatNumber(stats?.totalVolume.value)}</Text>
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
          </Flex>
        </Trace>
      </Screen>
    </BottomSheetModal>
  )
}
