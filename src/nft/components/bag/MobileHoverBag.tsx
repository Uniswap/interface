import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { body, bodySmall } from 'nft/css/common.css'
import { useBag } from 'nft/hooks'
import { ethNumberStandardFormatter, formatWeiToDecimal, roundAndPluralize } from 'nft/utils'

import * as styles from './MobileHoverBag.css'
export const MobileHoverBag = () => {
  const itemsInBag = useBag((state) => state.itemsInBag)
  const toggleBag = useBag((state) => state.toggleBag)
  const totalEthPrice = useBag((state) => state.totalEthPrice)
  const totalUsdPrice = useBag((state) => state.totalUsdPrice)

  const shouldShowBag = itemsInBag.length > 0

  return (
    <Row display={{ sm: shouldShowBag ? 'flex' : 'none', md: 'none' }} className={styles.bagContainer}>
      <Row gap="8">
        <Box position="relative" style={{ width: '34px', height: '34px' }}>
          {itemsInBag.slice(0, 3).map((item, index) => {
            return (
              <Box
                as="img"
                key={index}
                position="absolute"
                src={item.asset.smallImageUrl}
                top="1/2"
                left="1/2"
                width="26"
                height="26"
                borderRadius="4"
                style={{
                  transform:
                    index === 0
                      ? 'translate(-50%, -50%) rotate(-4.42deg)'
                      : index === 1
                      ? 'translate(-50%, -50%) rotate(-14.01deg)'
                      : 'translate(-50%, -50%) rotate(10.24deg)',
                  zIndex: index,
                }}
              />
            )
          })}
        </Box>
        <Column>
          <Box className={body} fontWeight="semibold">
            {roundAndPluralize(itemsInBag.length, 'item')}
          </Box>
          <Row gap="8">
            <Box className={body}>{`${formatWeiToDecimal(totalEthPrice.toString())}`}</Box>
            <Box color="textSecondary" className={bodySmall}>{`${ethNumberStandardFormatter(
              totalUsdPrice,
              true
            )}`}</Box>
          </Row>
        </Column>
      </Row>
      <Box className={styles.viewBagButton} onClick={toggleBag}>
        View bag
      </Box>
    </Row>
  )
}
