import { Trans } from '@lingui/macro'
// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption, ListingMarket } from 'nft/types'
import { useMemo, useState } from 'react'
import styled, { css } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

import { NFTListRow } from './NFTListRow'

const TableHeader = styled.div`
  display: flex;
  position: sticky;
  align-items: center;
  top: 72px;
  padding-top: 24px;
  padding-bottom: 24px;
  z-index: 1;
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
`

const NFTHeader = styled.div`
  flex: 2;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex: 1.5;
  }
`

const PriceHeaders = styled(Row)`
  flex: 1;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex: 3;
  }
`

const PriceInfoHeader = styled.div`
  display: none;
  flex: 1;

  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    display: flex;
  }
`

const DropdownWrapper = styled.div`
  flex: 2;
`

const FeeUserReceivesSharedStyles = css`
  display: none;
  justify-content: flex-end;
  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

const FeeHeader = styled.div`
  flex: 1;
  ${FeeUserReceivesSharedStyles}
`

const UserReceivesHeader = styled.div`
  flex: 1.5;
  ${FeeUserReceivesSharedStyles}
`

const RowDivider = styled.hr`
  height: 0px;
  width: 100%;
  border-radius: 20px;
  border-width: 0.5px;
  border-style: solid;
  border-color: ${({ theme }) => theme.backgroundInteractive};
`

export enum SetPriceMethod {
  SAME_PRICE,
  FLOOR_PRICE,
  PREV_LISTING,
}

export const NFTListingsGrid = ({ selectedMarkets }: { selectedMarkets: ListingMarket[] }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const [globalPriceMethod, setGlobalPriceMethod] = useState<SetPriceMethod>()
  const [globalPrice, setGlobalPrice] = useState<number>()

  const priceDropdownOptions: DropDownOption[] = useMemo(
    () => [
      {
        displayText: 'Same price',
        onClick: () => setGlobalPriceMethod(SetPriceMethod.SAME_PRICE),
      },
      {
        displayText: 'Floor price',
        onClick: () => setGlobalPriceMethod(SetPriceMethod.FLOOR_PRICE),
      },
      {
        displayText: 'Prev. listing',
        onClick: () => setGlobalPriceMethod(SetPriceMethod.PREV_LISTING),
      },
    ],
    []
  )

  return (
    <Column>
      <TableHeader>
        <NFTHeader>
          <Trans>NFT</Trans>
        </NFTHeader>
        <PriceHeaders>
          <PriceInfoHeader>
            <Trans>Floor</Trans>
          </PriceInfoHeader>
          <PriceInfoHeader>
            <Trans>Last</Trans>
          </PriceInfoHeader>

          <DropdownWrapper>
            <SortDropdown dropDownOptions={priceDropdownOptions} mini miniPrompt={t`Set price by`} />
          </DropdownWrapper>

          <FeeHeader>
            <Trans>Fees</Trans>
          </FeeHeader>
          <UserReceivesHeader>
            <Trans>You receive</Trans>
          </UserReceivesHeader>
        </PriceHeaders>
      </TableHeader>
      {sellAssets.map((asset) => {
        return (
          <>
            <NFTListRow
              asset={asset}
              globalPriceMethod={globalPriceMethod}
              globalPrice={globalPrice}
              setGlobalPrice={setGlobalPrice}
              selectedMarkets={selectedMarkets}
            />
            {sellAssets.indexOf(asset) < sellAssets.length - 1 && <RowDivider />}
          </>
        )
      })}
    </Column>
  )
}
