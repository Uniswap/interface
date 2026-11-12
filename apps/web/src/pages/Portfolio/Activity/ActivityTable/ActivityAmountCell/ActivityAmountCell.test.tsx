import { Token, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  useCurrencyInfo,
  useCurrencyInfos,
  useNativeCurrencyInfo,
  useWrappedNativeCurrencyInfo,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { ActivityAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ActivityAmountCell'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useCurrencyInfo: vi.fn(),
  useCurrencyInfos: vi.fn(),
  useNativeCurrencyInfo: vi.fn(),
  useWrappedNativeCurrencyInfo: vi.fn(),
}))

vi.mock('@universe/mycelium/icons/Plus', () => ({
  Plus: () => <span data-testid="liquidity-pair-plus-separator" />,
}))

vi.mock('@universe/mycelium/icons/Receipt', () => ({
  Receipt: () => <span data-testid="compact-thumbnail-placeholder" />,
}))

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
const PEPECOIN_ADDRESS = '0x1111111111111111111111111111111111111111'
const ONE_TOKEN = '1000000000000000000'
const FROM = '0x0000000000000000000000000000000000000001'

function currencyInfoFixture(symbol: string, address: string): CurrencyInfo {
  const currency = new Token(UniverseChainId.Mainnet, address, 18, symbol, symbol)
  return {
    currencyId: `${UniverseChainId.Mainnet}-${address}`,
    logoUrl: null,
    currency,
  }
}

function nativeCurrencyInfo(): CurrencyInfo {
  return {
    currencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
    logoUrl: null,
    currency: nativeOnChain(UniverseChainId.Mainnet),
  }
}

function wrappedNativeCurrencyInfo(): CurrencyInfo {
  const currency = WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet]
  if (!currency) {
    throw new Error('Missing wrapped native currency for mainnet')
  }
  return {
    currencyId: `${UniverseChainId.Mainnet}-${currency.address}`,
    logoUrl: null,
    currency,
  }
}

function baseTransaction(id: string, typeInfo: TransactionDetails['typeInfo']): TransactionDetails {
  return {
    routing: TradingApi.Routing.CLASSIC,
    id,
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Success,
    addedTime: 1,
    updatedTime: 1,
    from: FROM,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo,
  } as TransactionDetails
}

function lpIncentivesClaim(id: string, tokenAddresses: string[]): TransactionDetails {
  return baseTransaction(id, { type: TransactionType.LPIncentivesClaimRewards, tokenAddresses })
}

function mockCurrencyInfos(infos: CurrencyInfo[]): void {
  const byId = new Map(infos.map((info) => [info.currencyId, info]))
  mocked(useCurrencyInfo).mockImplementation((currencyId) => (currencyId ? byId.get(currencyId) : undefined))
}

describe('ActivityAmountCell — LP incentives claims', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the bare symbol for a one-token claim, with no amount placeholder', () => {
    mocked(useCurrencyInfos).mockReturnValue([currencyInfoFixture('UNI', UNI_ADDRESS)])

    render(<ActivityAmountCell transaction={lpIncentivesClaim('one', [UNI_ADDRESS])} />)

    // A claim records no amount; the formatter's "-" placeholder must never reach the row.
    expect(screen.queryByText('- UNI')).not.toBeInTheDocument()
    expect(screen.getAllByText('UNI').length).toBeGreaterThan(0)
  })

  it('renders every token of a multi-token claim', () => {
    mocked(useCurrencyInfos).mockReturnValue([
      currencyInfoFixture('UNI', UNI_ADDRESS),
      currencyInfoFixture('USDC', USDC_ADDRESS),
    ])

    render(<ActivityAmountCell transaction={lpIncentivesClaim('multi', [UNI_ADDRESS, USDC_ADDRESS])} />)

    expect(screen.getByText('UNI, USDC')).toBeInTheDocument()
  })

  it('caps a large claim at three symbols with a remainder count', () => {
    mocked(useCurrencyInfos).mockReturnValue([
      currencyInfoFixture('UNI', UNI_ADDRESS),
      currencyInfoFixture('USDC', USDC_ADDRESS),
      currencyInfoFixture('DAI', DAI_ADDRESS),
      currencyInfoFixture('WBTC', WBTC_ADDRESS),
    ])

    render(
      <ActivityAmountCell
        transaction={lpIncentivesClaim('overflow', [UNI_ADDRESS, USDC_ADDRESS, DAI_ADDRESS, WBTC_ADDRESS])}
      />,
    )

    expect(screen.getByText('UNI, USDC, DAI +1')).toBeInTheDocument()
  })

  it('renders an empty cell when no reward currency resolves', () => {
    mocked(useCurrencyInfos).mockReturnValue([undefined, undefined])

    render(<ActivityAmountCell transaction={lpIncentivesClaim('unresolved', [UNI_ADDRESS, USDC_ADDRESS])} />)

    expect(screen.queryByText(/UNI/)).not.toBeInTheDocument()
  })

  it('keeps the type label on a compact row when no reward currency resolves', () => {
    mocked(useCurrencyInfos).mockReturnValue([undefined, undefined])

    render(
      <ActivityAmountCell
        transaction={lpIncentivesClaim('unresolved', [UNI_ADDRESS, USDC_ADDRESS])}
        variant="compact"
      />,
    )

    // The row must still say what it is; only the logos and symbols are unavailable.
    expect(screen.getByText('Collected fees')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})

describe('ActivityAmountCell — pair, wrap, liquidity-pair, single', () => {
  const uni = currencyInfoFixture('UNI', UNI_ADDRESS)
  const usdc = currencyInfoFixture('USDC', USDC_ADDRESS)

  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrencyInfos([uni, usdc])
  })

  it('renders a compact unconfirmed EXACT_OUTPUT swap with a tilde on the input', () => {
    const transaction = baseTransaction('swap-exact-output', {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: uni.currencyId,
      outputCurrencyId: usdc.currencyId,
      outputCurrencyAmountRaw: ONE_TOKEN,
      expectedInputCurrencyAmountRaw: ONE_TOKEN,
      maximumInputCurrencyAmountRaw: ONE_TOKEN,
    })

    render(<ActivityAmountCell transaction={transaction} variant="compact" />)

    expect(screen.getByText('Swapped')).toBeInTheDocument()
    expect(screen.getByText(/~1\.00 UNI → 1\.00 USDC/)).toBeInTheDocument()
  })

  it('renders a full unconfirmed EXACT_OUTPUT swap with a tilde on the input', () => {
    const transaction = baseTransaction('swap-exact-output-full', {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_OUTPUT,
      inputCurrencyId: uni.currencyId,
      outputCurrencyId: usdc.currencyId,
      outputCurrencyAmountRaw: ONE_TOKEN,
      expectedInputCurrencyAmountRaw: ONE_TOKEN,
      maximumInputCurrencyAmountRaw: ONE_TOKEN,
    })

    render(<ActivityAmountCell transaction={transaction} />)

    expect(screen.getByText(/~1\.00 UNI/)).toBeInTheDocument()
    expect(screen.getByText(/1\.00 USDC/)).toBeInTheDocument()
    expect(screen.queryByText(/~1\.00 USDC/)).not.toBeInTheDocument()
  })

  it('renders wrap as native → wrapped and unwrap as wrapped → native', () => {
    const eth = nativeCurrencyInfo()
    const weth = wrappedNativeCurrencyInfo()
    mocked(useNativeCurrencyInfo).mockReturnValue(eth)
    mocked(useWrappedNativeCurrencyInfo).mockReturnValue(weth)

    const wrap = baseTransaction('wrap', {
      type: TransactionType.Wrap,
      unwrapped: false,
      currencyAmountRaw: ONE_TOKEN,
    })
    const unwrap = baseTransaction('unwrap', {
      type: TransactionType.Wrap,
      unwrapped: true,
      currencyAmountRaw: ONE_TOKEN,
    })

    const { rerender } = render(<ActivityAmountCell transaction={wrap} variant="compact" />)
    expect(screen.getByText('Wrapped')).toBeInTheDocument()
    expect(screen.getByText(/1\.00 ETH → 1\.00 WETH/)).toBeInTheDocument()

    rerender(<ActivityAmountCell transaction={unwrap} variant="compact" />)
    expect(screen.getByText('Unwrapped')).toBeInTheDocument()
    expect(screen.getByText(/1\.00 WETH → 1\.00 ETH/)).toBeInTheDocument()
  })

  it('renders a liquidity-pair with an & compact separator and a Plus full separator', () => {
    const transaction = baseTransaction('lp-increase', {
      type: TransactionType.LiquidityIncrease,
      currency0Id: uni.currencyId,
      currency1Id: usdc.currencyId,
      currency0AmountRaw: ONE_TOKEN,
      currency1AmountRaw: ONE_TOKEN,
    })

    const { rerender } = render(<ActivityAmountCell transaction={transaction} variant="compact" />)
    expect(screen.getByText('Add liquidity')).toBeInTheDocument()
    expect(screen.getByText(/1\.00 UNI & 1\.00 USDC/)).toBeInTheDocument()
    expect(screen.queryByTestId('liquidity-pair-plus-separator')).not.toBeInTheDocument()

    rerender(<ActivityAmountCell transaction={transaction} />)
    expect(screen.getByText(/1\.00 UNI/)).toBeInTheDocument()
    expect(screen.getByText(/1\.00 USDC/)).toBeInTheDocument()
    expect(screen.queryByText(/UNI &/)).not.toBeInTheDocument()
    expect(screen.getByTestId('liquidity-pair-plus-separator')).toBeInTheDocument()
  })

  it('omits a missing symbol on a full single-token row instead of rendering undefined', () => {
    mockCurrencyInfos([
      {
        currencyId: uni.currencyId,
        logoUrl: null,
        currency: new Token(UniverseChainId.Mainnet, UNI_ADDRESS, 18),
      },
    ])

    render(
      <ActivityAmountCell
        transaction={baseTransaction('send-nameless', {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: FROM,
          tokenAddress: UNI_ADDRESS,
          currencyAmountRaw: ONE_TOKEN,
        })}
      />,
    )

    expect(screen.getByText('1.00')).toBeInTheDocument()
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
  })

  it('renders a single-token send in both variants', () => {
    const transaction = baseTransaction('send-uni', {
      type: TransactionType.Send,
      assetType: AssetType.Currency,
      recipient: FROM,
      tokenAddress: UNI_ADDRESS,
      currencyAmountRaw: ONE_TOKEN,
    })

    const { rerender } = render(<ActivityAmountCell transaction={transaction} variant="compact" />)
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText(/1\.00 UNI/)).toBeInTheDocument()

    rerender(<ActivityAmountCell transaction={transaction} />)
    expect(screen.queryByText('Sent')).not.toBeInTheDocument()
    expect(screen.getByText(/1\.00 UNI/)).toBeInTheDocument()
  })

  it('truncates a compact single-token symbol longer than 6 characters', () => {
    const pepecoin = currencyInfoFixture('PEPECOIN', PEPECOIN_ADDRESS)
    mockCurrencyInfos([pepecoin])

    render(
      <ActivityAmountCell
        transaction={baseTransaction('send-pepecoin', {
          type: TransactionType.Send,
          assetType: AssetType.Currency,
          recipient: FROM,
          tokenAddress: PEPECOIN_ADDRESS,
          currencyAmountRaw: ONE_TOKEN,
        })}
        variant="compact"
      />,
    )

    expect(screen.getByText(/1\.00 PEPEC…/)).toBeInTheDocument()
    expect(screen.queryByText(/PEPECOIN/)).not.toBeInTheDocument()
  })
})

describe('ActivityAmountCell — compact thumbnails', () => {
  function nftMint(id: string, imageURL: string): TransactionDetails {
    return baseTransaction(id, {
      type: TransactionType.NFTMint,
      nftSummaryInfo: {
        tokenId: '5350',
        name: '#5350',
        collectionName: 'Flaunch',
        imageURL,
        address: FROM,
      },
    })
  }

  function uniToUsdcSwap(): TransactionDetails {
    return baseTransaction('swap', {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId: `${UniverseChainId.Mainnet}-${UNI_ADDRESS}`,
      outputCurrencyId: `${UniverseChainId.Mainnet}-${USDC_ADDRESS}`,
      inputCurrencyAmountRaw: ONE_TOKEN,
      expectedOutputCurrencyAmountRaw: ONE_TOKEN,
      minimumOutputCurrencyAmountRaw: ONE_TOKEN,
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrencyInfos([])
  })

  it('renders a compact NFT row with the type label and NFT name, like the token rows', () => {
    render(<ActivityAmountCell transaction={nftMint('nft', 'https://example.com/5350.png')} variant="compact" />)

    expect(screen.getByText('Minted')).toBeInTheDocument()
    expect(screen.getByText('#5350')).toBeInTheDocument()
    expect(screen.queryByText('Flaunch')).not.toBeInTheDocument()
    expect(screen.queryByTestId('compact-thumbnail-placeholder')).not.toBeInTheDocument()
  })

  it('keeps the thumbnail slot on a compact NFT row without an image', () => {
    render(<ActivityAmountCell transaction={nftMint('nft-no-image', '')} variant="compact" />)

    expect(screen.getByText('#5350')).toBeInTheDocument()
    expect(screen.getByTestId('compact-thumbnail-placeholder')).toBeInTheDocument()
  })

  it('leaves the full NFT row unchanged', () => {
    render(<ActivityAmountCell transaction={nftMint('nft-full', 'https://example.com/5350.png')} />)

    expect(screen.getByText('#5350')).toBeInTheDocument()
    expect(screen.getByText('Flaunch')).toBeInTheDocument()
    expect(screen.queryByText('Minted')).not.toBeInTheDocument()
  })

  it('keeps the thumbnail slot on a compact pair row with only one currency resolved', () => {
    mockCurrencyInfos([currencyInfoFixture('UNI', UNI_ADDRESS)])

    render(<ActivityAmountCell transaction={uniToUsdcSwap()} variant="compact" />)

    expect(screen.getByText('Swapped')).toBeInTheDocument()
    expect(screen.getByTestId('compact-thumbnail-placeholder')).toBeInTheDocument()
  })

  it('shows no placeholder on a compact token row whose currencies resolve', () => {
    mockCurrencyInfos([currencyInfoFixture('UNI', UNI_ADDRESS), currencyInfoFixture('USDC', USDC_ADDRESS)])

    render(<ActivityAmountCell transaction={uniToUsdcSwap()} variant="compact" />)

    expect(screen.getByText(/1\.00 UNI → ~1\.00 USDC/)).toBeInTheDocument()
    expect(screen.queryByTestId('compact-thumbnail-placeholder')).not.toBeInTheDocument()
  })
})
