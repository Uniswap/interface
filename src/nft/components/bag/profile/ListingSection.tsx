import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { ApprovedCheckmarkIcon, ChevronUpIcon, FailedListingIcon, LoadingIcon } from 'nft/components/icons'
import { badge, bodySmall, buttonTextSmall, subhead } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { AssetRow, CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import { formatEthPrice, numberToWei } from 'nft/utils/currency'
import { useEffect, useState } from 'react'

import * as styles from './ListingModal.css'

export const ListingSection = ({
  sectionTitle,
  caption = undefined,
  title = undefined,
  rows,
  index,
  openIndex,
  isSuccessScreen = false,
}: {
  sectionTitle: string
  caption?: string
  title?: string
  rows: AssetRow[]
  index: number
  openIndex: number
  isSuccessScreen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const notAllApproved = rows.some((row: AssetRow) => row.status !== ListingStatus.APPROVED)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const removeAssetMarketplace = useSellAsset((state) => state.removeAssetMarketplace)

  const removeRow = (row: any) => {
    // collections
    if (index === 1) {
      for (const asset of sellAssets)
        if (asset.asset_contract.address === row.collectionAddress) removeAssetMarketplace(asset, row.marketplace)
    }
    // listings
    else removeAssetMarketplace(row.asset, row.marketplace)
  }

  useEffect(() => {
    setIsOpen(index === openIndex)
  }, [index, openIndex])

  function getListingRowPrice(row: AssetRow): number | undefined {
    const listingRow = row as ListingRow
    const newListings = listingRow.asset.newListings
    return newListings?.find((listing) => listing.marketplace.name === listingRow.marketplace.name)?.price ?? 0
  }

  const allApproved = !notAllApproved && rows.length > 0 && !isSuccessScreen

  return (
    <Row
      flexWrap="wrap"
      className={subhead}
      marginTop="10"
      marginBottom="10"
      onClick={() => rows.length > 0 && setIsOpen(!isOpen)}
      color={allApproved ? 'accentSuccess' : 'textPrimary'}
    >
      {allApproved && <ApprovedCheckmarkIcon style={{ marginRight: '8px' }} />}
      {sectionTitle}
      {!isSuccessScreen && <ChevronUpIcon className={clsx(`${isOpen ? '' : styles.chevronDown} ${styles.chevron}`)} />}
      {(isOpen || isSuccessScreen) && (
        <Column
          gap="12"
          width="full"
          paddingTop={isSuccessScreen ? '28' : 'auto'}
          className={clsx(!isSuccessScreen && styles.listingSectionBorder)}
        >
          {caption && (
            <Box color="textPrimary" fontWeight="normal" className={caption}>
              {caption}
            </Box>
          )}
          {title && (
            <Box color="textSecondary" className={badge}>
              {title}
            </Box>
          )}
          <Column gap="8">
            {rows.map((row: AssetRow, index) => {
              return (
                <Column key={index} gap="8">
                  <Row>
                    {row.images?.map((image, index) => {
                      return (
                        <Box
                          as="img"
                          height="20"
                          width="20"
                          borderRadius={index === 0 && (row as CollectionRow).collectionAddress ? 'round' : '4'}
                          style={{ zIndex: 2 - index }}
                          className={styles.listingModalIcon}
                          src={image}
                          alt={row.name}
                          key={index}
                        />
                      )
                    })}
                    <Box
                      marginLeft="8"
                      marginRight="auto"
                      fontWeight="normal"
                      color="textPrimary"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      whiteSpace="nowrap"
                      maxWidth={{
                        sm: 'max',
                        md:
                          row.status === ListingStatus.REJECTED || row.status === ListingStatus.FAILED ? '120' : 'full',
                      }}
                      className={bodySmall}
                    >
                      {row.name}
                    </Box>
                    {isSuccessScreen ? (
                      getListingRowPrice(row) &&
                      `${formatEthPrice(numberToWei(getListingRowPrice(row) ?? 0).toString())} ETH`
                    ) : row.status === ListingStatus.APPROVED ? (
                      <ApprovedCheckmarkIcon height="20" width="20" />
                    ) : row.status === ListingStatus.FAILED || row.status === ListingStatus.REJECTED ? (
                      <Row gap="4">
                        <Box fontWeight="normal" fontSize="14" color="textSecondary">
                          {row.status}
                        </Box>
                        <FailedListingIcon />
                      </Row>
                    ) : (
                      row.status === ListingStatus.SIGNING && <LoadingIcon height="20" width="20" stroke="#4673FA" />
                    )}
                  </Row>
                  {(row.status === ListingStatus.FAILED || row.status === ListingStatus.REJECTED) && (
                    <Row gap="8" justifyContent="center">
                      <Box
                        width="120"
                        as="button"
                        className={buttonTextSmall}
                        borderRadius="12"
                        border="none"
                        color="red400"
                        height="32"
                        cursor="pointer"
                        style={{ backgroundColor: '#FA2B391A' }}
                        onClick={async (e) => {
                          e.stopPropagation()
                          removeRow(row)
                        }}
                      >
                        Remove
                      </Box>
                      <Box
                        width="120"
                        as="button"
                        className={buttonTextSmall}
                        borderRadius="12"
                        border="none"
                        color="accentAction"
                        height="32"
                        cursor="pointer"
                        style={{ backgroundColor: '#4C82FB29' }}
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (row.callback) {
                            await row.callback()
                          }
                        }}
                      >
                        Try again
                      </Box>
                    </Row>
                  )}
                </Column>
              )
            })}
          </Column>
        </Column>
      )}
    </Row>
  )
}
