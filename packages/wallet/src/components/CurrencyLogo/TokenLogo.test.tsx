import { ChainId } from 'uniswap/src/types/chains'
import { render } from 'wallet/src/test/test-utils'
import { TokenLogo } from './TokenLogo'

describe('TokenLogo', () => {
  it('renders without error', () => {
    const tree = render(
      <TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" url="https://example.com" />
    )

    expect(tree).toMatchSnapshot()
  })

  describe('token image', () => {
    it('renders svg when url is svg', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" url="https://example.com/image.svg" />
      )

      const tokenRemoteSvg = queryByTestId('token-remote-svg')
      const tokenImage = queryByTestId('token-image')

      expect(tokenRemoteSvg).toBeTruthy()
      expect(tokenImage).toBeFalsy()
    })

    it('renders image when url is valid and not svg', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" url="https://example.com/image.png" />
      )

      const tokenRemoteSvg = queryByTestId('token-remote-svg')
      const tokenImage = queryByTestId('token-image')

      expect(tokenRemoteSvg).toBeFalsy()
      expect(tokenImage).toBeTruthy()
    })

    it('renders fallback text when url is not specified', () => {
      const { queryByText } = render(<TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" />)

      const fallbackText = queryByText('DAI')

      expect(fallbackText).toBeTruthy()
    })

    it('renders fallback text when url is invalid', () => {
      const { queryByText } = render(
        <TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" url="invalid-url" />
      )

      const fallbackText = queryByText('DAI')

      expect(fallbackText).toBeTruthy()
    })

    it('does not render fallback text when url is valid', () => {
      const { queryByText } = render(
        <TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" url="https://example.com/image.svg" />
      )

      const fallbackText = queryByText('DAI')

      expect(fallbackText).toBeFalsy()
    })
  })

  describe('network logo', () => {
    it('renders network logo by default', () => {
      const { queryByTestId } = render(
        <TokenLogo chainId={ChainId.ArbitrumOne} symbol="DAI" url="https://example.com" />
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('renders network logo when hideNetworkLogo is false', () => {
      const { queryByTestId } = render(
        <TokenLogo
          chainId={ChainId.ArbitrumOne}
          hideNetworkLogo={false}
          symbol="DAI"
          url="https://example.com"
        />
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('does not render network logo when hideNetworkLogo is true', () => {
      const { queryByTestId } = render(
        <TokenLogo
          hideNetworkLogo
          chainId={ChainId.ArbitrumOne}
          symbol="DAI"
          url="https://example.com"
        />
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
        <TokenLogo chainId={ChainId.Mainnet} symbol="DAI" url="https://example.com" />
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeFalsy()
    })
  })
})
