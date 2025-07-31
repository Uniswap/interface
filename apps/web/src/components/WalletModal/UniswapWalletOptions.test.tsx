import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useWalletConnectors } from 'features/wallet/connection/hooks/useWalletConnectors'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import {
  EMBEDDED_WALLET_CONNECTOR,
  METAMASK_CONNECTOR,
  UNISWAP_EXTENSION_CONNECTOR,
  UNISWAP_WALLET_CONNECTOR,
  WALLET_CONNECT_CONNECTOR,
} from 'test-utils/wallets/fixtures'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

vi.mock('features/wallet/connection/hooks/useWalletConnectors', () => ({
  useWalletConnectors: vi.fn(),
}))

vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
}))

describe('UniswapWalletOptions Test', () => {
  beforeEach(() => {
    mocked(useWalletConnectors).mockImplementation(() => [
      WALLET_CONNECT_CONNECTOR,
      EMBEDDED_WALLET_CONNECTOR,
      METAMASK_CONNECTOR,
      UNISWAP_EXTENSION_CONNECTOR,
      UNISWAP_WALLET_CONNECTOR,
    ])
  })
  it('Download wallet option should be visible if extension is not detected', () => {
    mocked(useWalletConnectors).mockImplementation(() => [
      WALLET_CONNECT_CONNECTOR,
      EMBEDDED_WALLET_CONNECTOR,
      METAMASK_CONNECTOR,
      UNISWAP_WALLET_CONNECTOR,
    ])
    mocked(useFeatureFlag).mockReturnValue(true)
    const { asFragment } = render(<UniswapWalletOptions />)
    expect(asFragment()).toMatchSnapshot()
    const downloadOption = screen.getByTestId('download-uniswap-wallet')
    expect(downloadOption).toBeInTheDocument()
  })
  it('Extension connecter should be shown if detected', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    const { asFragment } = render(<UniswapWalletOptions />)
    expect(asFragment()).toMatchSnapshot()
    const connectWallet = screen.getByTestId('connect-uniswap-extension')
    expect(connectWallet).toBeInTheDocument()
  })
})
