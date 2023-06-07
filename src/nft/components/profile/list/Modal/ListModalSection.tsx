import { Plural, Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { ChevronUpIcon, ListingModalWindowActive, ListingModalWindowClosed } from 'nft/components/icons'
import { useSellAsset } from 'nft/hooks'
import { AssetRow, CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import { useMemo } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'
import { TRANSITION_DURATIONS } from 'theme/styles'

import { ContentRow } from './ContentRow'

const SectionHeader = styled(Row)`
  justify-content: space-between;
`

const SectionTitle = styled(ThemedText.SubHeader)<{ active: boolean; approved: boolean }>`
  line-height: 24px;
  color: ${({ theme, active, approved }) =>
    approved ? theme.accentSuccess : active ? theme.textPrimary : theme.textSecondary};
`

const SectionArrow = styled(ChevronUpIcon)<{ active: boolean }>`
  height: 24px;
  width: 24px;
  cursor: pointer;
  transition: ${TRANSITION_DURATIONS.medium}ms;
  transform: rotate(${({ active }) => (active ? 0 : 180)}deg);
`

const SectionBody = styled(Column)`
  border-left: 1.5px solid ${colors.gray650};
  margin-top: 4px;
  margin-left: 7px;
  padding-top: 4px;
  padding-left: 20px;
  max-height: 394px;
  overflow-y: auto;
  ${ScrollBarStyles}
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-left: 4px;
  color: ${({ theme }) => theme.textSecondary};
`

const ContentRowContainer = styled(Column)`
  gap: 8px;
  scroll-behavior: smooth;
`

export const enum Section {
  APPROVE,
  SIGN,
}

interface ListModalSectionProps {
  sectionType: Section
  active: boolean
  content: AssetRow[]
  toggleSection: React.DispatchWithoutAction
}

export const ListModalSection = ({ sectionType, active, content, toggleSection }: ListModalSectionProps) => {
  const theme = useTheme()
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const removeAssetMarketplace = useSellAsset((state) => state.removeAssetMarketplace)
  const allContentApproved = useMemo(() => !content.some((row) => row.status !== ListingStatus.APPROVED), [content])
  const isCollectionApprovalSection = sectionType === Section.APPROVE
  const uniqueCollections = useMemo(() => {
    if (isCollectionApprovalSection) {
      const collections = content.map((collection) => (collection as CollectionRow).collectionAddress)
      const uniqueCollections = [...new Set(collections)]
      return uniqueCollections.length
    }
    return undefined
  }, [content, isCollectionApprovalSection])
  const removeRow = (row: AssetRow) => {
    // collections
    if (isCollectionApprovalSection) {
      const collectionRow = row as CollectionRow
      for (const asset of sellAssets)
        if (asset.asset_contract.address === collectionRow.collectionAddress)
          removeAssetMarketplace(asset, collectionRow.marketplace)
    }
    // listings
    else {
      const listingRow = row as ListingRow
      removeAssetMarketplace(listingRow.asset, listingRow.marketplace)
    }
  }
  return (
    <Column>
      <SectionHeader>
        <Row>
          {active || allContentApproved ? (
            <ListingModalWindowActive fill={allContentApproved ? theme.accentSuccess : theme.accentAction} />
          ) : (
            <ListingModalWindowClosed />
          )}
          <SectionTitle active={active} marginLeft="12px" approved={allContentApproved}>
            {isCollectionApprovalSection ? (
              <>
                <Trans>Approve</Trans>&nbsp;
                <Plural value={uniqueCollections} _1="collection" other="collections" />
              </>
            ) : (
              <>
                <Trans>Sign</Trans> &nbsp;{content.length}&nbsp;{' '}
                <Plural value={content.length} _1="listing" other="listings" />
              </>
            )}
          </SectionTitle>
        </Row>
        <SectionArrow
          active={active}
          secondaryColor={active ? theme.textPrimary : theme.textSecondary}
          onClick={toggleSection}
        />
      </SectionHeader>
      {active && (
        <SectionBody>
          {isCollectionApprovalSection && (
            <Row height="16px" marginBottom="16px">
              <ThemedText.Caption lineHeight="16px" color="textSecondary">
                <Trans>Why is a transaction required?</Trans>
              </ThemedText.Caption>
              <MouseoverTooltip
                text={<Trans>Listing an NFT requires a one-time marketplace approval for each NFT collection.</Trans>}
              >
                <StyledInfoIcon />
              </MouseoverTooltip>
            </Row>
          )}
          <ContentRowContainer>
            {content.map((row: AssetRow) => (
              <ContentRow
                row={row}
                key={row?.name ?? row.marketplace.name}
                removeRow={removeRow}
                isCollectionApprovalSection={isCollectionApprovalSection}
              />
            ))}
          </ContentRowContainer>
        </SectionBody>
      )}
    </Column>
  )
}
