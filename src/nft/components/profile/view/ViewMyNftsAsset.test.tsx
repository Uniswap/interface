import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { WalletAsset } from 'nft/types'
import { render } from 'test-utils/render'

import { ViewMyNftsAsset } from './ViewMyNftsAsset'

const AssetFixture: WalletAsset = {
  id: 'TmZ0QXNzZXQ6RVRIRVJFVU1fMHgyOTY1MkMyZTlEMzY1NjQzNEJjODEzM2M2OTI1OEM4ZDA1MjkwZjQxXzIzNTk=',
  imageUrl: 'https://c.neevacdn.net/image/upload/xyz/T96PksTnWGNh79CrzLn-zpYfqRWtD5wME0MBPL_Md6Q.png',
  smallImageUrl:
    'https://c.neevacdn.net/image/upload/c_limit,pg_1,h_1200,w_1200/f_webp/xyz/T96PksTnWGNh79CrzLn-zpYfqRWtD5wME0MBPL_Md6Q.webp',
  notForSale: true,
  priceInfo: {
    ETHPrice: '0',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '0',
  },
  name: 'Froggy Friend #2359',
  tokenId: '2359',
  asset_contract: {
    address: '0x29652c2e9d3656434bc8133c69258c8d05290f41',
    tokenType: NftStandard.Erc721,
    name: 'Froggy Friends Official',
    description: '4444 of the friendliest frogs in the metaverse.',
    image_url: 'https://i.seadn.io/gcs/files/84483786d97b4d471cb48d224c4c5c91.png?w=500&auto=format',
  },
  collection: {
    address: '0x29652c2e9d3656434bc8133c69258c8d05290f41',
    name: 'Froggy Friends Official',
    isVerified: true,
    imageUrl: 'https://i.seadn.io/gcs/files/84483786d97b4d471cb48d224c4c5c91.png?w=500&auto=format',
    twitterUrl: '@FroggyFriendNFT',
  },
  collectionIsVerified: true,
  lastPrice: 0,
  floorPrice: 0.0775,
  basisPoints: 0,
  date_acquired: '1682024661',
  sellOrders: [],
}

describe('NftCard', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <ViewMyNftsAsset
        asset={AssetFixture}
        mediaShouldBePlaying={false}
        setCurrentTokenPlayingMedia={() => undefined}
        hideDetails={false}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
