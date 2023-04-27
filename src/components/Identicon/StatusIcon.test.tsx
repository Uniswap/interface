import { useWeb3React } from '@web3-react/core'
import { getConnections } from 'connection'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import StatusIcon from './StatusIcon'

jest.mock('../../hooks/useSocksBalance', () => ({
  useHasSocks: () => true,
}))

describe('StatusIcon', () => {
  describe('with no account', () => {
    it('renders children in correct order', () => {
      const supportedConnections = getConnections()
      const injectedConnection = supportedConnections[1]
      const component = render(<StatusIcon connection={injectedConnection} />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
    })

    it('renders without mini icons', () => {
      const supportedConnections = getConnections()
      const injectedConnection = supportedConnections[1]
      const component = render(<StatusIcon connection={injectedConnection} showMiniIcons={false} />)
      expect(component.getByTestId('StatusIconRoot').children.length).toEqual(0)
    })
  })

  describe('with account', () => {
    beforeEach(() => {
      mocked(useWeb3React).mockReturnValue({
        account: '0x52270d8234b864dcAC9947f510CE9275A8a116Db',
        isActive: true,
      } as ReturnType<typeof useWeb3React>)
    })

    it('renders children in correct order', () => {
      const supportedConnections = getConnections()
      const injectedConnection = supportedConnections[1]
      const component = render(<StatusIcon connection={injectedConnection} />)
      expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
    })

    it('renders without mini icons', () => {
      const supportedConnections = getConnections()
      const injectedConnection = supportedConnections[1]
      const component = render(<StatusIcon connection={injectedConnection} showMiniIcons={false} />)
      expect(component.getByTestId('StatusIconRoot').children.length).toEqual(1)
    })
  })
})
