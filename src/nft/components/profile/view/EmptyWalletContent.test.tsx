import { render } from 'test-utils'

import { EmptyWalletModule } from './EmptyWalletContent'

describe('EmptyWalletContent.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <div>
        <EmptyWalletModule type="nft" />
        <EmptyWalletModule type="token" />
        <EmptyWalletModule type="activity" />
        <EmptyWalletModule type="pool" />
      </div>
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
