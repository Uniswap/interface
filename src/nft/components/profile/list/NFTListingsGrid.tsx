import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption, ListingMarket } from 'nft/types'
import { useMemo, useReducer, useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'

import { Dropdown } from './Dropdown'
import { NFTListRow } from './NFTListRow'
import { SetPriceMethod } from './shared'

const TableHeader = styled.div`
  display: flex;
  position: sticky;
  align-items: center;
  top: 72px;
  padding-top: 24px;
  padding-bottom: 24px;
  z-index: 3;
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: normal;
  line-height: 20px;
  border-radius: 12px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    padding-left: 48px;
  }
`

const NFTHeader = styled.div`
  flex: 2;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex: 1.5;
  }
`

const PriceHeaders = styled(Row)`
  flex: 1.5;
  margin-right: 12px;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    flex: 3;
  }
`

const LastPriceHeader = styled.div`
  display: none;
  flex: 1;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

const FloorPriceHeader = styled.div`
  display: none;
  flex: 1;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    display: flex;
  }
`

const DropdownAndHeaderWrapper = styled(Row)`
  flex: 2;
  gap: 4px;
`

const DropdownPromptContainer = styled(Column)`
  position: relative;
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const DropdownPrompt = styled(Row)`
  gap: 4px;
  background-color: ${({ theme }) => theme.surface3};
  cursor: pointer;
  font-weight: 535;
  font-size: 12px;
  line-height: 16px;
  border-radius: 4px;
  padding: 2px 6px;
  width: min-content;
  white-space: nowrap;
  color: ${({ theme }) => theme.neutral1};

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

const DropdownChevron = styled(ChevronDown)<{ isOpen: boolean }>`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral2};
  transform: ${({ isOpen }) => isOpen && 'rotate(180deg)'};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `transform ${duration.fast} ${timing.ease}`};
`

const DropdownContainer = styled.div`
  position: absolute;
  top: 36px;
  right: 0px;
`

const FeeUserReceivesSharedStyles = css`
  display: none;
  justify-content: flex-end;
  @media screen and (min-width: ${BREAKPOINTS.md}px) {
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
  margin: 0;
  border-color: ${({ theme }) => theme.surface3};
`

export const NFTListingsGrid = ({ selectedMarkets }: { selectedMarkets: ListingMarket[] }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const [globalPriceMethod, setGlobalPriceMethod] = useState(SetPriceMethod.CUSTOM)
  const [globalPrice, setGlobalPrice] = useState<number>()
  const [showDropdown, toggleShowDropdown] = useReducer((s) => !s, false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(dropdownRef, showDropdown ? toggleShowDropdown : undefined)

  const priceDropdownOptions: DropDownOption[] = useMemo(
    () => [
      {
        displayText: 'Custom',
        isSelected: globalPriceMethod === SetPriceMethod.CUSTOM,
        onClick: () => {
          setGlobalPriceMethod(SetPriceMethod.CUSTOM)
          toggleShowDropdown()
        },
      },
      {
        displayText: 'Floor price',
        isSelected: globalPriceMethod === SetPriceMethod.FLOOR_PRICE,
        onClick: () => {
          setGlobalPriceMethod(SetPriceMethod.FLOOR_PRICE)
          toggleShowDropdown()
        },
      },
      {
        displayText: 'Last price',
        isSelected: globalPriceMethod === SetPriceMethod.LAST_PRICE,
        onClick: () => {
          setGlobalPriceMethod(SetPriceMethod.LAST_PRICE)
          toggleShowDropdown()
        },
      },
      {
        displayText: 'Same price',
        isSelected: globalPriceMethod === SetPriceMethod.SAME_PRICE,
        onClick: () => {
          setGlobalPriceMethod(SetPriceMethod.SAME_PRICE)
          toggleShowDropdown()
        },
      },
    ],
    [globalPriceMethod]
  )

  let prompt
  switch (globalPriceMethod) {
    case SetPriceMethod.CUSTOM:
      prompt = <Trans>Custom</Trans>
      break
    case SetPriceMethod.FLOOR_PRICE:
      prompt = <Trans>Floor price</Trans>
      break
    case SetPriceMethod.LAST_PRICE:
      prompt = <Trans>Last Price</Trans>
      break
    case SetPriceMethod.SAME_PRICE:
      prompt = <Trans>Same Price</Trans>
      break
    default:
      break
  }

  return (
    <Column>
      <TableHeader>
        <NFTHeader>
          <Trans>NFT</Trans>
        </NFTHeader>
        <PriceHeaders>
          <FloorPriceHeader>
            <Trans>Floor</Trans>
          </FloorPriceHeader>
          <LastPriceHeader>
            <Trans>Last</Trans>
          </LastPriceHeader>

          <DropdownAndHeaderWrapper ref={dropdownRef}>
            <Trans>Price</Trans>
            <DropdownPromptContainer>
              <DropdownPrompt onClick={toggleShowDropdown}>
                {prompt} <DropdownChevron isOpen={showDropdown} />
              </DropdownPrompt>
              {showDropdown && (
                <DropdownContainer>
                  <Dropdown dropDownOptions={priceDropdownOptions} width={200} />
                </DropdownContainer>
              )}
            </DropdownPromptContainer>
          </DropdownAndHeaderWrapper>

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
