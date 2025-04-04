import { ReceiveScreen } from 'src/app/features/receive/ReceiveScreen'
import { cleanup, render, screen } from 'src/test/test-utils'
import { ACCOUNT, preloadedWalletPackageState } from 'wallet/src/test/fixtures'

const preloadedState = preloadedWalletPackageState({
  account: ACCOUNT,
})

describe(ReceiveScreen, () => {
  it('renders without error', async () => {
    const tree = render(<ReceiveScreen />, { preloadedState })

    expect(tree).toMatchSnapshot()
    cleanup()
  })

  it('renders a QR code', async () => {
    render(<ReceiveScreen />, { preloadedState })

    const qrCode = await screen.getByTestId('wallet-qr-code')
    expect(qrCode).toBeDefined()
    cleanup()
  })
})
