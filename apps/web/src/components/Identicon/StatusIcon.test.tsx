import { deprecatedInjectedConnection } from 'connection'
import { render, waitFor } from 'test-utils/render'

import StatusIcon from 'components/Identicon/StatusIcon'

const ACCOUNT = '0x52270d8234b864dcAC9947f510CE9275A8a116Db'

jest.mock('../../hooks/useSocksBalance', () => ({
  useHasSocks: () => true,
}))

describe('StatusIcon', () => {
  describe('with no account', () => {
    it('renders children in correct order', () => {
      const component = render(<StatusIcon account="" connection={deprecatedInjectedConnection} />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
    })

    it('renders without mini icons', async () => {
      const component = render(
        <StatusIcon account="" connection={deprecatedInjectedConnection} showMiniIcons={false} />
      )
      await waitFor(() => expect(component.queryByTestId('IdenticonLoader')).not.toBeInTheDocument())
      expect(component.getByTestId('StatusIconRoot').children.length).toEqual(0)
    })
  })

  describe('with account', () => {
    it('renders children in correct order', () => {
      const component = render(<StatusIcon account={ACCOUNT} connection={deprecatedInjectedConnection} />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
    })

    it('renders without mini icons', async () => {
      const component = render(
        <StatusIcon account={ACCOUNT} connection={deprecatedInjectedConnection} showMiniIcons={false} />
      )
      await waitFor(() => expect(component.queryByTestId('IdenticonLoader')).not.toBeInTheDocument())
      expect(component.getByTestId('StatusIconRoot').children.length).toEqual(1)
    })
  })
})
