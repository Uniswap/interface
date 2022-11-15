import { NavIcon } from 'components/NavBar/NavIcon'
import { useIsNftProfilePage } from 'hooks/useIsNftPage'
import { BagIcon, HundredsOverflowIcon } from 'nft/components/icons'
import { useBag, useSellAsset } from 'nft/hooks'
import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import shallow from 'zustand/shallow'

const CounterDot = styled.div`
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 100px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  font-size: 10px;
  line-height: 12px;
  min-height: 16px;
  min-width: 16px;
  padding: 2px 4px;
  position: absolute;
  right: 0px;
  text-align: center;
  top: 4px;
`

export const Bag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const [bagQuantity, setBagQuantity] = useState(0)

  const isNftProfilePage = useIsNftProfilePage()

  const { bagExpanded, setBagExpanded } = useBag(
    ({ bagExpanded, setBagExpanded }) => ({ bagExpanded, setBagExpanded }),
    shallow
  )
  const { resetSellAssets } = useSellAsset(
    ({ reset }) => ({
      resetSellAssets: reset,
    }),
    shallow
  )
  const handleIconClick = useCallback(() => {
    if (isNftProfilePage && bagExpanded) {
      resetSellAssets()
    }
    setBagExpanded({ bagExpanded: !bagExpanded })
  }, [bagExpanded, isNftProfilePage, resetSellAssets, setBagExpanded])

  useEffect(() => {
    setBagQuantity(itemsInBag.length)
  }, [itemsInBag])

  const bagHasItems = bagQuantity > 0

  return (
    <NavIcon isActive={bagExpanded} onClick={handleIconClick}>
      <BagIcon viewBox="0 0 24 24" width={24} height={24} />
      {bagHasItems && <CounterDot>{bagQuantity > 99 ? <HundredsOverflowIcon /> : bagQuantity}</CounterDot>}
    </NavIcon>
  )
}
