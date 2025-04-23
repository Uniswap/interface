import { getTokenDetailsURL } from 'graphql/data/util'
import { approvedERC20, approvedERC721, InteractiveToken, TokenStandard } from 'pages/Landing/assets/approvedTokens'
import { Ticker } from 'pages/Landing/components/TokenCloud/Ticker'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCloud, ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import { mixArrays } from 'uniswap/src/components/IconCloud/utils'

const tokenList = mixArrays(approvedERC20, approvedERC721, 0.33) as InteractiveToken[]

export function TokenCloud() {
  const renderOuterElement = useCallback((item: ItemPoint<InteractiveToken>) => {
    return <Ticker itemPoint={item} />
  }, [])

  const getElementRounded = useCallback((item: ItemPoint<InteractiveToken>) => {
    return item.itemData.standard === TokenStandard.ERC20
  }, [])

  const navigate = useNavigate()
  const onPress = useCallback(
    (item: ItemPoint<InteractiveToken>) => {
      const { address, chain, standard } = item.itemData
      navigate(
        standard === TokenStandard.ERC20
          ? getTokenDetailsURL({
              address,
              chain,
            })
          : `/nfts/collection/${address}`,
      )
    },
    [navigate],
  )

  return (
    <IconCloud
      data={tokenList}
      renderOuterElement={renderOuterElement}
      getElementRounded={getElementRounded}
      onPress={onPress}
    />
  )
}
