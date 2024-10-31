import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useConnectorWithId } from 'components/WalletModal/useOrderedConnections'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { UNISWAP_EXTENSION_CONNECTOR, WALLET_CONNECT_CONNECTOR } from 'test-utils/wagmi/fixtures'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

jest.mock('components/WalletModal/useOrderedConnections', () => ({
  useConnectorWithId: jest.fn(),
}))

jest.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: jest.fn(),
}))

describe('UniswapWalletOptions Test', () => {
  beforeEach(() => {
    mocked(useConnectorWithId).mockImplementation((id) =>
      id === CONNECTION_PROVIDER_IDS.WALLET_CONNECT_CONNECTOR_ID ? WALLET_CONNECT_CONNECTOR : undefined,
    )
  })
  it('Download wallet option should be visible if extension is not detected', () => {
    mocked(useConnectorWithId).mockImplementation((id) =>
      id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS ? undefined : WALLET_CONNECT_CONNECTOR,
    )
    mocked(useFeatureFlag).mockReturnValue(true)
    const { asFragment } = render(<UniswapWalletOptions />)
    expect(asFragment()).toMatchSnapshot()
    const downloadOption = screen.getByTestId('download-uniswap-wallet')
    expect(downloadOption).toBeInTheDocument()
  })
  it('Extension connecter should be shown if detected', () => {
    mocked(useConnectorWithId).mockImplementation((id) =>
      id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS ? UNISWAP_EXTENSION_CONNECTOR : WALLET_CONNECT_CONNECTOR,
    )
    mocked(useFeatureFlag).mockReturnValue(false)
    const { asFragment } = render(<UniswapWalletOptions />)
    expect(asFragment()).toMatchSnapshot()
    const connectWallet = screen.getByTestId('connect-uniswap-extension')
    expect(connectWallet).toBeInTheDocument()
  })
})
