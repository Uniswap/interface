import { BigNumber } from '@ethersproject/bignumber'
import * as Card from 'nft/components/collection/Card'
import { MouseEvent, useMemo } from 'react'

import { GenieAsset } from '../../types'
import { formatWeiToDecimal } from '../../utils/currency'

export const CollectionAsset = ({ asset }: { asset: GenieAsset }) => {
  // ignore structure more will go inside
  const { notForSale } = useMemo(() => {
    if (asset) {
      return {
        notForSale: asset.notForSale || BigNumber.from(asset.currentEthPrice ? asset.currentEthPrice : 0).lt(0),
      }
    } else {
      return {
        notForSale: true,
      }
    }
  }, [asset])

  return (
    <Card.Container asset={asset}>
      <Card.Image />
      <Card.DetailsContainer>
        <Card.InfoContainer>
          <Card.PrimaryRow>
            <Card.PrimaryDetails>
              <Card.PrimaryInfo>{asset.name ? asset.name : `#${asset.tokenId}`}</Card.PrimaryInfo>
            </Card.PrimaryDetails>
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>
                {notForSale ? '' : `${formatWeiToDecimal(asset.currentEthPrice)} ETH`}
              </Card.SecondaryInfo>
            </Card.SecondaryDetails>
            {asset.tokenType !== 'ERC1155' && asset.marketplace && (
              <Card.MarketplaceIcon marketplace={asset.marketplace} />
            )}
          </Card.SecondaryRow>
        </Card.InfoContainer>
        <Card.Button
          selectedChildren={'Remove'}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
          }}
          onSelectedClick={(e: MouseEvent) => {
            e.preventDefault()
          }}
        >
          {'Buy now'}
        </Card.Button>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
