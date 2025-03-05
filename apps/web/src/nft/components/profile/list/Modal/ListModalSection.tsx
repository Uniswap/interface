import { ScrollBarStyles } from 'components/Common/styles'
import { MouseoverTooltip } from 'components/Tooltip'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled, { useTheme } from 'lib/styled-components'
import { ChevronUpIcon, ListingModalWindowActive, ListingModalWindowClosed } from 'nft/components/icons'
import { ContentRow } from 'nft/components/profile/list/Modal/ContentRow'
import { useSellAsset } from 'nft/hooks'
import { AssetRow, CollectionRow, ListingRow, ListingStatus } from 'nft/types'
import { useMemo } from 'react'
import { Info } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { colors } from 'theme/colors'
import { ThemedText } from 'theme/components'
import { TRANSITION_DURATIONS } from 'theme/styles'

const SectionHeader = styled(Row)`
  justify-content: space-between;
`

const SectionTitle = styled(ThemedText.SubHeader)<{ active: boolean; approved: boolean }>`
  line-height: 24px;
  color: ${({ theme, active, approved }) => (approved ? theme.success : active ? theme.neutral1 : theme.neutral2)};
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
  color: ${({ theme }) => theme.neutral2};
`

const ContentRowContainer = styled(Column)`
  gap: 8px;
  scroll-behavior: smooth;
`

export const enum Section {
  APPROVE = 0,
  SIGN = 1,
}

interface ListModalSectionProps {
  sectionType: Section
  active: boolean
  content: AssetRow[]
  toggleSection: React.DispatchWithoutAction
}

export const ListModalSection = ({ sectionType, active, content, toggleSection }: ListModalSectionProps) => {
  const { t } = useTranslation()
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
      for (const asset of sellAssets) {
        if (asset.asset_contract.address === collectionRow.collectionAddress) {
          removeAssetMarketplace(asset, collectionRow.marketplace)
        }
      }
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
            <ListingModalWindowActive fill={allContentApproved ? theme.success : theme.accent1} />
          ) : (
            <ListingModalWindowClosed />
          )}
          <SectionTitle active={active} marginLeft="12px" approved={allContentApproved}>
            {isCollectionApprovalSection
              ? t('nfts.collection.action.approve', { count: uniqueCollections ?? 1 })
              : t('nfts.collection.action.sign', { count: content.length })}
          </SectionTitle>
        </Row>
        <SectionArrow
          active={active}
          secondaryColor={active ? theme.neutral1 : theme.neutral2}
          onClick={toggleSection}
        />
      </SectionHeader>
      {active && (
        <SectionBody>
          {isCollectionApprovalSection && (
            <Row height="16px" marginBottom="16px">
              <ThemedText.BodySmall lineHeight="16px" color="neutral2">
                <Trans i18nKey="nft.whyTransaction" />
              </ThemedText.BodySmall>
              <MouseoverTooltip text={<Trans i18nKey="nft.whyTransaction.reason" />}>
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
