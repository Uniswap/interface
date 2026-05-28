import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { render } from 'test-utils/render'

describe('EmptyWalletContent.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <>
        <EmptyWalletModule type="nft" />
        <EmptyWalletModule type="token" />
        <EmptyWalletModule type="activity" />
        <EmptyWalletModule type="pool" />
      </>,
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
