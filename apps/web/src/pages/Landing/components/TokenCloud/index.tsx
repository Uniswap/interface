import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { IconCloud, ItemPoint } from 'uniswap/src/components/IconCloud/IconCloud'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { InteractiveToken } from '~/pages/Landing/assets/approvedTokens'
import { Ticker } from '~/pages/Landing/components/TokenCloud/Ticker'
import { usePromoTokensData } from '~/pages/Landing/components/TokenCloud/usePromoTokensData'

export function TokenCloud(): JSX.Element {
  const { tokenList, getTokenPricePercentChange } = usePromoTokensData()

  const renderOuterElement = useCallback(
    (item: ItemPoint<InteractiveToken>) => {
      return (
        <Ticker
          itemPoint={item}
          pricePercentChange={getTokenPricePercentChange(item.itemData.chain, item.itemData.address)}
        />
      )
    },
    [getTokenPricePercentChange],
  )

  const navigate = useNavigate()
  const onPress = useCallback(
    (item: ItemPoint<InteractiveToken>) => {
      const { address, chain } = item.itemData
      Promise.resolve(
        navigate(
          getTokenDetailsURL({
            address,
            chain,
          }),
        ),
      ).catch(() => {})
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
