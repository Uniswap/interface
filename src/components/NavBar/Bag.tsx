import { NavIcon } from 'components/NavBar/NavIcon'
import { useIsNftProfilePage } from 'hooks/useIsNftPage'
import { BagIcon, HundredsOverflowIcon, TagIcon } from 'nft/components/icons'
import { useBag, useSellAsset } from 'nft/hooks'
import { useCallback } from 'react'
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
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const isProfilePage = useIsNftProfilePage()

  const { bagExpanded, setBagExpanded } = useBag(
    ({ bagExpanded, setBagExpanded }) => ({ bagExpanded, setBagExpanded }),
    shallow
  )

  const handleIconClick = useCallback(() => {
    setBagExpanded({ bagExpanded: !bagExpanded })
  }, [bagExpanded, setBagExpanded])

  const bagQuantity = isProfilePage ? sellAssets.length : itemsInBag.length
  const bagHasItems = bagQuantity > 0

  return (
    <NavIcon isActive={bagExpanded} onClick={handleIconClick}>
      {isProfilePage ? (
        <TagIcon viewBox="0 0 24 24" width={24} height={24} />
      ) : (
        <BagIcon viewBox="0 0 24 24" width={24} height={24} strokeWidth="2px" />
      )}
      {bagHasItems && <CounterDot>{bagQuantity > 99 ? <HundredsOverflowIcon /> : bagQuantity}</CounterDot>}
    </NavIcon>
  )
}
