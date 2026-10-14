import { UniverseChainId } from '@universe/chains'
import { AuctionOptionItem } from 'uniswap/src/components/lists/items/auctions/AuctionOptionItem'
import { type AuctionOption, OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { render } from 'uniswap/src/test/test-utils'
import { ONE_HOUR_MS } from 'utilities/src/time/time'

const TOKEN_ADDRESS = '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999'

const option: AuctionOption = {
  type: OnchainItemListOptionType.Auction,
  auctionId: '1_0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  auctionAddress: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  chainId: UniverseChainId.Mainnet,
  tokenAddress: TOKEN_ADDRESS,
  tokenSymbol: 'FOO',
  tokenName: 'FooCoin',
  tokenLogoUrl: undefined,
  currencyInfo: null,
  committedVolumeUsd: 188_800,
  isVerified: false,
}

// The test i18n leaves keys unresolved, so translated labels assert on their keys.
describe('AuctionOptionItem', () => {
  it('shows the symbol and truncated token address with an empty right slot without searchStats', () => {
    const { getAllByText, getByText, queryByText } = render(<AuctionOptionItem option={option} onPress={() => {}} />)

    expect(getByText('FooCoin')).toBeTruthy()
    // The logo falls back to the symbol without a logoUrl, so 'FOO' renders twice.
    expect(getAllByText('FOO').length).toBeGreaterThan(0)
    expect(getByText('0x9999...9999')).toBeTruthy()
    expect(queryByText('stats.fdv')).toBeNull()
  })

  it('keeps the address subtitle and fills the right slot with searchStats', () => {
    const { getByText } = render(
      <AuctionOptionItem
        option={option}
        searchStats={{ fdvUsd: 1_234_567, endTimeMs: Date.now() + ONE_HOUR_MS }}
        onPress={() => {}}
      />,
    )

    expect(getByText('0x9999...9999')).toBeTruthy()
    expect(getByText('$1.2M')).toBeTruthy()
    expect(getByText('search.results.auction.timeRemaining')).toBeTruthy()
  })

  it('lets an explicit rightElement win over the stats', () => {
    const { getByText, queryByText } = render(
      <AuctionOptionItem
        option={option}
        searchStats={{ fdvUsd: 1_234_567, endTimeMs: Date.now() + ONE_HOUR_MS }}
        rightElement={<>caller-owned</>}
        onPress={() => {}}
      />,
    )

    expect(getByText('caller-owned')).toBeTruthy()
    expect(queryByText('stats.fdv')).toBeNull()
  })
})
