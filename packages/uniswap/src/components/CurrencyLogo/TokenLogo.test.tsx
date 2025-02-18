import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

// This test expects the invalid image URLs to fail to load, so
// we silence the error logs to keep the test output clean.
jest.mock('utilities/src/logger/logger')

jest.mock('ui/src/components/UniversalImage/internal/PlainImage', () => ({
  ...jest.requireActual('ui/src/components/UniversalImage/internal/PlainImage.web'),
}))

describe('TokenLogo', () => {
  it('renders without error', () => {
    const tree = render(<TokenLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" url="https://example.com" />)

    expect(tree).toMatchSnapshot()
  })

  describe('token image', () => {
    it('renders svg when url is svg', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" url="https://example.com/image.svg" />,
      )

      const tokenRemoteSvg = queryByTestId('svg-token-image')
      const tokenImage = queryByTestId('img-token-image')

      expect(tokenRemoteSvg).toBeTruthy()
      expect(tokenImage).toBeFalsy()
    })

    it('renders image when url is valid and not svg', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" url="https://example.com/image.png" />,
      )

      const tokenRemoteSvg = queryByTestId('svg-token-image')
      const tokenImage = queryByTestId('img-token-image')

      expect(tokenRemoteSvg).toBeFalsy()
      expect(tokenImage).toBeTruthy()
    })

    it('renders fallback text when url is not specified', () => {
      const { queryByText } = render(<TokenLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" />)

      const fallbackText = queryByText('DAI')

      expect(fallbackText).toBeTruthy()
    })

    it('renders image for an absolute path (local file)', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" url="invalid-url" />,
      )

      const tokenRemoteSvg = queryByTestId('svg-token-image')
      const tokenImage = queryByTestId('img-token-image')

      expect(tokenRemoteSvg).toBeFalsy()
      expect(tokenImage).toBeTruthy()
    })

    it('does not render fallback text when url is valid', () => {
      const { queryByText } = render(
        <TokenLogo
          chainId={UniverseChainId.ArbitrumOne}
          symbol="DAI"
          url="https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png"
        />,
      )

      const fallbackText = queryByText('DAI')

      expect(fallbackText).toBeFalsy()
    })
  })

  describe('network logo', () => {
    it('renders network logo by default', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" url="https://example.com" />,
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('renders network logo when hideNetworkLogo is false', () => {
      const { queryByTestId } = render(
        <TokenLogo
          chainId={UniverseChainId.ArbitrumOne}
          hideNetworkLogo={false}
          symbol="DAI"
          url="https://example.com"
        />,
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('does not render network logo when hideNetworkLogo is true', () => {
      const { queryByTestId } = render(
        <TokenLogo hideNetworkLogo chainId={UniverseChainId.ArbitrumOne} symbol="DAI" url="https://example.com" />,
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeFalsy()
    })

    it('does not render network logo when chainId is not specified', () => {
      const { queryByTestId } = render(<TokenLogo symbol="DAI" url="https://example.com" />)

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeFalsy()
    })

    it('does not render network logo when chainId is Mainnet', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={UniverseChainId.Mainnet} symbol="DAI" url="https://example.com" />,
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeFalsy()
    })
  })
})
