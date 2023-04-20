import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { GenieAsset, Markets, UniformAspectRatios } from 'nft/types'
import { render } from 'test-utils/render'

import { CollectionAsset } from './CollectionAsset'

const AssetFixture: GenieAsset = {
  id: 'TmZ0QXNzZXQ6MHhlZDVhZjM4ODY1MzU2N2FmMmYzODhlNjIyNGRjN2M0YjMyNDFjNTQ0XzMzMTg=',
  address: '0xed5af388653567af2f388e6224dc7c4b3241c544',
  notForSale: false,
  collectionName: 'Azuki',
  imageUrl:
    'https://cdn.center.app/1/0xED5AF388653567Af2F388E6224dC7C4b3241C544/3318/50ed67ad647d0aa0cad0b830d136a677efc2fb72a44587bc35f2a5fb334a7fdf.png',
  marketplace: Markets.Opensea,
  name: 'Azuki #3318',
  priceInfo: {
    ETHPrice: '15800000000000000000',
    baseAsset: 'ETH',
    baseDecimals: '18',
    basePrice: '15800000000000000000',
  },
  susFlag: false,
  tokenId: '3318',
  tokenType: NftStandard.Erc721,
  totalCount: 10000,
  collectionIsVerified: true,
  rarity: {
    primaryProvider: 'Rarity Sniper',
    providers: [
      {
        rank: 7079,
        provider: 'Rarity Sniper',
      },
    ],
  },
  creator: {},
}

describe('NftCard', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <CollectionAsset
        asset={AssetFixture}
        isMobile={false}
        mediaShouldBePlaying={false}
        setCurrentTokenPlayingMedia={() => undefined}
        uniformAspectRatio={UniformAspectRatios.square}
        setUniformAspectRatio={() => undefined}
        setRenderedHeight={() => undefined}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
