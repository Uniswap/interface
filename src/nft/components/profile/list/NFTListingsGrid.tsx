import { Trans } from '@lingui/macro'
// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Column, Row } from 'nft/components/Flex'
import { bodySmall, subheadSmall } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption, ListingMarket } from 'nft/types'
import { useMemo, useState } from 'react'
import styled from 'styled-components/macro'

import * as styles from './ListPage.css'
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
        <Column
          marginLeft="0"
          transition="500"
          className={bodySmall}
          color="textSecondary"
          flex={{ sm: '2', md: '1.5' }}
        >
          <Trans>NFT</Trans>
        </Column>
        <Row flex={{ sm: '1', md: '3' }}>
          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', xxl: 'flex' }}
            textAlign="left"
          >
            <Trans>Floor</Trans>
          </Column>
          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', xxl: 'flex' }}
            textAlign="left"
          >
            <Trans>Last</Trans>
          </Column>
          <Column className={subheadSmall} flex="2">
            <SortDropdown dropDownOptions={priceDropdownOptions} mini miniPrompt={t`Set price by`} />
          </Column>

          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', lg: 'flex' }}
            textAlign="right"
          >
            <Trans>Fees</Trans>
          </Column>
          <Column
            className={bodySmall}
            display={{ sm: 'none', lg: 'flex' }}
            color="textSecondary"
            flex="1.5"
            textAlign="right"
          >
            <Trans>You receive</Trans>
          </Column>
        </Row>
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
            {sellAssets.indexOf(asset) < sellAssets.length - 1 && <hr className={styles.nftDivider} />}
          </>
        )
      })}
    </Column>
  )
}
