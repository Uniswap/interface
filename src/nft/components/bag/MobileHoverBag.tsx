import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { body, bodySmall } from 'nft/css/common.css'
import { useBag } from 'nft/hooks'
import { BagItemStatus } from 'nft/types'
import { ethNumberStandardFormatter, fetchPrice, formatWeiToDecimal, roundAndPluralize } from 'nft/utils'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'

import * as styles from './MobileHoverBag.css'

const MobileHoverBag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const toggleBag = useBag((state) => state.toggleBag)

  const { pathname } = useLocation()
  const isNFTSellPage = pathname.startsWith('/nfts/sell')
  const isNFTPage = pathname.startsWith('/nfts')
  const shouldShowBag = itemsInBag.length > 0 && isNFTPage && !isNFTSellPage

  const { data: usdPrice } = useQuery(['fetchPrice', {}], () => fetchPrice(), {})

  const { totalEthPrice, totalUsdPrice } = useMemo(() => {
    const totalEthPrice = itemsInBag.reduce(
      (total, item) =>
        item.status !== BagItemStatus.UNAVAILABLE
          ? total.add(
              BigNumber.from(
                item.asset.updatedPriceInfo ? item.asset.updatedPriceInfo.ETHPrice : item.asset.priceInfo.ETHPrice
              )
            )
          : total,
      BigNumber.from(0)
    )
    const totalUsdPrice = usdPrice ? parseFloat(formatEther(totalEthPrice)) * usdPrice : undefined

    return { totalEthPrice, totalUsdPrice }
  }, [itemsInBag, usdPrice])

  return (
    <Row display={{ sm: shouldShowBag ? 'flex' : 'none', md: 'none' }} className={styles.bagContainer}>
      <Column>
        <Box className={body} fontWeight="semibold">
          {roundAndPluralize(itemsInBag.length, 'item')}
        </Box>
        <Row gap="8">
          <Box className={body}>{`${formatWeiToDecimal(totalEthPrice.toString())}`}</Box>
          <Box color="textSecondary" className={bodySmall}>{`${ethNumberStandardFormatter(totalUsdPrice, true)}`}</Box>
        </Row>
      </Column>
      <Box className={styles.viewBagButton} onClick={toggleBag}>
        View bag
      </Box>
    </Row>
  )
}

export default MobileHoverBag
