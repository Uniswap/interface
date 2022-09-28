import { NavIcon } from 'components/NavBar/NavIcon'
import * as styles from 'components/NavBar/ShoppingBag.css'
import { Box } from 'nft/components/Box'
import { BagIcon, HundredsOverflowIcon, TagIcon } from 'nft/components/icons'
import { useBag, useSellAsset } from 'nft/hooks'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export const ShoppingBag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const [bagQuantity, setBagQuantity] = useState(0)
  const [sellQuantity, setSellQuantity] = useState(0)
  const location = useLocation()

  const toggleBag = useBag((s) => s.toggleBag)

  useEffect(() => {
    setBagQuantity(itemsInBag.length)
  }, [itemsInBag])

  useEffect(() => {
    setSellQuantity(sellAssets.length)
  }, [sellAssets])

  const isProfilePage = location.pathname === '/profile'

  return (
    <NavIcon onClick={toggleBag}>
      {isProfilePage ? (
        <>
          <TagIcon width={20} height={20} />
          {sellQuantity ? (
            <Box className={styles.bagQuantity}>{sellQuantity > 99 ? <HundredsOverflowIcon /> : sellQuantity}</Box>
          ) : null}
        </>
      ) : (
        <>
          <BagIcon width={20} height={20} />
          {bagQuantity ? (
            <Box className={styles.bagQuantity}>{bagQuantity > 99 ? <HundredsOverflowIcon /> : bagQuantity}</Box>
          ) : null}
        </>
      )}
    </NavIcon>
  )
}
