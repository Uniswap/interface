import { NavIcon } from 'components/NavBar/NavIcon'
import * as styles from 'components/NavBar/ShoppingBag.css'
import { Box } from 'nft/components/Box'
import { BagIcon, HundredsOverflowIcon } from 'nft/components/icons'
import { useBag } from 'nft/hooks'
import { useEffect, useState } from 'react'

export const ShoppingBag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const [bagQuantity, setBagQuantity] = useState(0)

  const toggleBag = useBag((s) => s.toggleBag)

  useEffect(() => {
    setBagQuantity(itemsInBag.length)
  }, [itemsInBag])

  const bagHasItems = bagQuantity > 0

  return (
    <NavIcon onClick={toggleBag}>
      <BagIcon viewBox="0 0 20 20" width={24} height={24} />
      {bagHasItems && (
        <Box className={styles.bagQuantity}>{bagQuantity > 99 ? <HundredsOverflowIcon /> : bagQuantity}</Box>
      )}
    </NavIcon>
  )
}
