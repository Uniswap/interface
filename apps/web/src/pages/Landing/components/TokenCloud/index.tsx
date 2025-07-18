import { getTokenDetailsURL } from 'appGraphql/data/util'
import { approvedERC20, InteractiveToken } from 'pages/Landing/assets/approvedTokens'
import { Ticker } from 'pages/Landing/components/TokenCloud/Ticker'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { IconCloud, ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import { shuffleArray } from 'uniswap/src/components/IconCloud/utils'

const tokenList = shuffleArray(approvedERC20) as InteractiveToken[]

export function TokenCloud() {
  const renderOuterElement = useCallback((item: ItemPoint<InteractiveToken>) => {
    return <Ticker itemPoint={item} />
  }, [])

  const navigate = useNavigate()
  const onPress = useCallback(
    (item: ItemPoint<InteractiveToken>) => {
      const { address, chain } = item.itemData
      navigate(
        getTokenDetailsURL({
          address,
          chain,
        }),
      )
    },
    [navigate],
  )

  return (
    <IconCloud
      data={tokenList}
      renderOuterElement={renderOuterElement}
      onPress={onPress}
      getElementRounded={() => true}
    />
  )
}
