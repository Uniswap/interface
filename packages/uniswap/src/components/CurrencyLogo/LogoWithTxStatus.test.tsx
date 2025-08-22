import {
  DappLogoWithTxStatus,
  DappLogoWithWCBadge,
  LogoWithTxStatus,
  LogoWithTxStatusProps,
} from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'uniswap/src/entities/assets'
import { ALL_EVM_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ETH_CURRENCY_INFO, ethCurrencyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { render } from 'uniswap/src/test/test-utils'
import { createFixture, randomChoice, randomEnumValue } from 'uniswap/src/test/utils'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'

jest.mock('ui/src/components/UniversalImage/internal/PlainImage', () => ({
  ...jest.requireActual('ui/src/components/UniversalImage/internal/PlainImage.web'),
}))

const currencyLogoProps = createFixture<LogoWithTxStatusProps>()(() => ({
  assetType: AssetType.Currency,
  txType: TransactionType.Send,
  currencyInfo: ethCurrencyInfo(),
  txStatus: randomEnumValue(TransactionStatus),
  size: 40,
  chainId: randomChoice(ALL_EVM_CHAIN_IDS),
}))

const nftLogoProps = createFixture<LogoWithTxStatusProps>()(() => ({
  assetType: AssetType.ERC721,
  txType: TransactionType.NFTMint,
  txStatus: randomEnumValue(TransactionStatus),
  size: 40,
  chainId: randomChoice(ALL_EVM_CHAIN_IDS),
}))

describe(LogoWithTxStatus, () => {
  it('renders without error', () => {
    const tree = render(
      <LogoWithTxStatus
        {...currencyLogoProps({
          currencyInfo: ETH_CURRENCY_INFO,
          txStatus: TransactionStatus.Pending,
          chainId: UniverseChainId.Mainnet,
        })}
      />,
    )

    expect(tree).toMatchSnapshot()
  })

  describe('logo', () => {
    it('shows CurrencyLogo for currency', () => {
      const { queryByTestId } = render(<LogoWithTxStatus {...currencyLogoProps()} />)

      expect(queryByTestId('moonpay-logo')).toBeFalsy()
      expect(queryByTestId('token-logo')).toBeTruthy()
      expect(queryByTestId('nft-viewer')).toBeFalsy()
    })

    it('shows NFTViewer in other cases', () => {
      const { queryByTestId } = render(<LogoWithTxStatus {...nftLogoProps()} />)

      expect(queryByTestId('moonpay-logo')).toBeFalsy()
      expect(queryByTestId('token-logo')).toBeFalsy()
      expect(queryByTestId('nft-viewer')).toBeTruthy()
    })
  })

  describe('icon', () => {
    describe('transaction summary network logo', () => {
      it('shows network logo if chainId is specified and is not Mainnet', () => {
        const { queryByTestId } = render(
          <LogoWithTxStatus {...currencyLogoProps({ chainId: UniverseChainId.ArbitrumOne })} />,
        )

        expect(queryByTestId('network-logo')).toBeTruthy()
      })

      it('does not show network logo if chainId is not specified', () => {
        const { queryByTestId } = render(<LogoWithTxStatus {...currencyLogoProps({ chainId: null })} />)

        expect(queryByTestId('network-logo')).toBeFalsy()
      })

      it('does not show network logo if chainId is Mainnet', () => {
        const { queryByTestId } = render(
          <LogoWithTxStatus {...currencyLogoProps({ chainId: UniverseChainId.Mainnet })} />,
        )

        expect(queryByTestId('network-logo')).toBeFalsy()
      })
    })

    describe('transaction status icon when chainID is Mainnet', () => {
      const transactionWithIcons = [
        TransactionType.Approve,
        TransactionType.NFTApprove,
        TransactionType.Send,
        TransactionType.OnRampPurchase,
        TransactionType.OnRampTransfer,
        TransactionType.OffRampSale,
        TransactionType.Receive,
        TransactionType.NFTMint,
        TransactionType.ClaimUni,
        TransactionType.LPIncentivesClaimRewards,
        TransactionType.Unknown,
      ]
      const transactionWithoutIcons = Object.values(TransactionType).filter(
        (txType) => !transactionWithIcons.includes(txType),
      )

      const nftAssetTypesWithIcons = [AssetType.ERC721, AssetType.ERC1155]
      const nftAssetTypesWithoutIcons = Object.values(AssetType).filter(
        (assetType) => !nftAssetTypesWithIcons.includes(assetType),
      )

      for (const txType of transactionWithIcons) {
        it(`shows icon for ${txType}`, () => {
          const { queryByTestId } = render(
            <LogoWithTxStatus {...currencyLogoProps({ chainId: UniverseChainId.Mainnet })} txType={txType} />,
          )

          expect(queryByTestId('status-icon')).toBeTruthy()
        })
      }

      for (const assetType of nftAssetTypesWithIcons) {
        it(`shows icon for NFTTrade if asset type ${assetType}`, () => {
          const { queryByTestId } = render(
            <LogoWithTxStatus
              {...currencyLogoProps({ chainId: UniverseChainId.Mainnet })}
              assetType={assetType}
              txType={TransactionType.NFTTrade}
            />,
          )

          expect(queryByTestId('status-icon')).toBeTruthy()
        })
      }

      for (const txType of transactionWithoutIcons) {
        it(`does not show icon for ${txType}`, () => {
          const { queryByTestId } = render(
            <LogoWithTxStatus {...currencyLogoProps({ chainId: UniverseChainId.Mainnet })} txType={txType} />,
          )

          expect(queryByTestId('status-icon')).toBeFalsy()
        })
      }

      for (const assetType of nftAssetTypesWithoutIcons) {
        it(`does not show icon for NFTTrade if asset type ${assetType}`, () => {
          const { queryByTestId } = render(
            <LogoWithTxStatus
              {...currencyLogoProps({ chainId: UniverseChainId.Mainnet })}
              assetType={assetType}
              txType={TransactionType.NFTTrade}
            />,
          )

          expect(queryByTestId('status-icon')).toBeFalsy()
        })
      }
    })
  })
})

// Mock ImageUri component using the native implementation
// (this is needed because native implementation is not used by default
// with our test setup where we exclude files with native extensions)
jest.mock('uniswap/src/components/nfts/images/ImageUri', () =>
  jest.requireActual('uniswap/src/components/nfts/images/ImageUri.native.tsx'),
)

describe(DappLogoWithTxStatus, () => {
  const props = {
    event: WalletConnectEvent.Connected,
    size: 40,
    chainId: UniverseChainId.ArbitrumOne as UniverseChainId,
    dappImageUrl: 'https://example.com/dapp.png',
    dappName: 'Dapp',
  }

  describe('renders without error', () => {
    it('with dapp name', () => {
      const tree = render(<DappLogoWithTxStatus {...props} />)

      expect(tree).toMatchSnapshot()
    })
  })

  describe('status icon', () => {
    const showedIconCases: [string, WalletConnectEvent, string][] = [
      ['NetworkChanged', WalletConnectEvent.NetworkChanged, 'network-logo'],
      ['TransactionConfirmed', WalletConnectEvent.TransactionConfirmed, 'icon-approve'],
      ['TransactionFailed', WalletConnectEvent.TransactionFailed, 'icon-alert'],
    ]

    // eslint-disable-next-line max-params
    it.each(showedIconCases)('shows proper icon for %s event', (_, event, iconTestId) => {
      const { queryByTestId } = render(<DappLogoWithTxStatus {...props} event={event} />)

      expect(queryByTestId(iconTestId)).toBeTruthy()
    })

    const hiddenIconCases: [string, WalletConnectEvent][] = [
      ['Connected', WalletConnectEvent.Connected],
      ['Disconnected', WalletConnectEvent.Disconnected],
    ]

    it.each(hiddenIconCases)('does not show icon for %s event', (_, event) => {
      const { queryByTestId } = render(<DappLogoWithTxStatus {...props} event={event} />)

      expect(queryByTestId('icon-approve')).toBeFalsy()
      expect(queryByTestId('icon-alert')).toBeFalsy()
      expect(queryByTestId('network-logo')).toBeFalsy()
    })

    it('does not render an icon if there is no event', () => {
      const { queryByTestId } = render(<DappLogoWithTxStatus {...props} />)

      expect(queryByTestId('icon-approve')).toBeFalsy()
      expect(queryByTestId('icon-alert')).toBeFalsy()
      expect(queryByTestId('network-logo')).toBeFalsy()
    })
  })

  describe('dapp image', () => {
    it('renders dapp image if dappImageUrl is provided', () => {
      const { queryByTestId } = render(<DappLogoWithTxStatus {...props} />)

      expect(queryByTestId('dapp-image')).toBeTruthy()
      expect(queryByTestId('image-fallback')).toBeFalsy()
    })

    it('renders fallback image if dappImageUrl is not provided', () => {
      const { queryByTestId } = render(<DappLogoWithTxStatus {...props} dappImageUrl={undefined} />)

      expect(queryByTestId('dapp-image')).toBeFalsy()
      expect(queryByTestId('image-fallback')).toBeTruthy()
    })
  })
})

describe(DappLogoWithWCBadge, () => {
  const props = {
    size: 40,
    chainId: UniverseChainId.ArbitrumOne as UniverseChainId,
    dappImageUrl: 'https://example.com/dapp.png',
    dappName: 'Dapp',
  }

  it('renders without error', () => {
    const tree = render(<DappLogoWithWCBadge {...props} />)

    expect(tree).toMatchSnapshot()
  })

  describe('dapp image', () => {
    it('renders dapp icon placeholder if dappImageUrl is not provided', () => {
      const { queryByTestId } = render(<DappLogoWithWCBadge {...props} dappImageUrl={undefined} />)

      expect(queryByTestId('img-dapp-image')).toBeFalsy()
      expect(queryByTestId('dapp-icon-placeholder')).toBeTruthy()
    })

    it('renders dapp image if dappImageUrl is provided', () => {
      const { queryByTestId } = render(<DappLogoWithWCBadge {...props} />)

      expect(queryByTestId('img-dapp-image')).toBeTruthy()
      expect(queryByTestId('dapp-icon-placeholder')).toBeFalsy()
    })
  })

  describe('network logo', () => {
    it('renders transaction summary network logo if chain is not Mainnet', () => {
      const { queryByTestId } = render(<DappLogoWithWCBadge {...props} />)

      expect(queryByTestId('network-logo')).toBeTruthy()
      expect(queryByTestId('wallet-connect-logo')).toBeFalsy()
    })

    it('renders wallet connect logo if chain is Mainnet', () => {
      const { queryByTestId } = render(<DappLogoWithWCBadge {...props} chainId={UniverseChainId.Mainnet} />)

      expect(queryByTestId('network-logo')).toBeFalsy()
      expect(queryByTestId('wallet-connect-logo')).toBeTruthy()
    })
  })
})
