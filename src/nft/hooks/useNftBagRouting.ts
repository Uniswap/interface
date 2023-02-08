import { useWeb3React } from '@web3-react/core'
import { useNftRoute } from 'graphql/data/nft/Routing'
import { BagItem } from 'nft/types'
import { buildNftTradeInputFromBagItems } from 'nft/utils'

export default function useNftBagRouting(itemsInBag: BagItem[], enabled?: boolean) {
  const { account } = useWeb3React()

  useNftRoute(enabled ? account ?? '' : '', enabled ? buildNftTradeInputFromBagItems(itemsInBag) : [])
}
