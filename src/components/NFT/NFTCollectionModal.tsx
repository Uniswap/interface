import React from 'react'
import { useTranslation } from 'react-i18next'
import VerifiedIcon from 'src/assets/icons/verified.svg'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { LongText } from 'src/components/text/LongText'
import { PollingInterval } from 'src/constants/misc'
import { useNftCollectionQuery } from 'src/features/nfts/api'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { theme } from 'src/styles/theme'
import { formatNFTFloorPrice, formatNumber } from 'src/utils/format'

export function NFTCollectionModal({
  slug,
  isVisible,
  onClose,
}: {
  isVisible: boolean
  slug: string
  onClose: () => void
}) {
  const { t } = useTranslation()

  const { currentData: collection } = useNftCollectionQuery(
    {
      openseaSlug: slug,
    },
    {
      pollingInterval: PollingInterval.Normal,
    }
  )
  const collectionName = collection?.name ?? ''

  return (
    <BottomSheetModal isVisible={isVisible} name={ModalName.NftCollection} onClose={onClose}>
      <Screen edges={['bottom']} pt="md" px="lg">
        <Trace section={SectionName.NFTCollectionModal}>
          <Flex gap="sm">
            {/* Collection image and name */}
            <Flex alignItems="center" gap="sm">
              {collection?.image_url && (
                <Box borderRadius="full" height={60} overflow="hidden" width={60}>
                  <NFTViewer uri={collection?.image_url} />
                </Box>
              )}
              <Flex centered row gap="xxs">
                <Box flexShrink={1}>
                  <Text color="textPrimary" variant="subheadLarge">
                    {collectionName}{' '}
                    {collection?.safelist_request_status === 'verified' && (
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
            <Flex flexDirection="row" gap="xxs">
              <Flex fill alignItems="center" gap="xxs">
                <Text color="textTertiary" variant="subheadSmall">
                  {t('Items')}
                </Text>
                {collection?.stats.total_supply && (
                  <Text variant="bodyLarge">{formatNumber(collection?.stats.total_supply)}</Text>
                )}
              </Flex>
              <Flex fill alignItems="center" gap="xxs">
                <Text color="textTertiary" variant="subheadSmall">
                  {t('Owners')}
                </Text>
                {collection?.stats.num_owners && (
                  <Text variant="bodyLarge">{formatNumber(collection?.stats.num_owners)}</Text>
                )}
              </Flex>
              {collection?.stats.floor_price && (
                <Flex fill alignItems="center" gap="xxs">
                  <Text color="textTertiary" variant="subheadSmall">
                    {t('Floor')}
                  </Text>
                  <Text variant="bodyLarge">
                    {t('{{price}} ETH', {
                      price: formatNFTFloorPrice(collection?.stats.floor_price),
                    })}
                  </Text>
                </Flex>
              )}
              {collection?.stats.total_volume && (
                <Flex fill alignItems="center" gap="xxs">
                  <Text color="textTertiary" variant="subheadSmall">
                    {t('Volume')}
                  </Text>
                  <Text variant="bodyLarge">{formatNumber(collection?.stats.total_volume)}</Text>
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
