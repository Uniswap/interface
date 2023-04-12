import { getConnections } from 'connection'
import { render } from 'test-utils'

import StatusIcon from './StatusIcon'

jest.mock('../../hooks/useSocksBalance', () => ({
  useHasSocks: () => true,
}))

describe('StatusIcon', () => {
  it('renders children in correct order, with no account and with socks', () => {
    const supportedConnections = getConnections()
    const injectedConnection = supportedConnections[1]
    const component = render(<StatusIcon connection={injectedConnection} />)
    expect(component.getByTestId('StatusIconRoot')).toMatchSnapshot()
  })

  it('renders with no account and showMiniIcons=false', () => {
    const supportedConnections = getConnections()
    const injectedConnection = supportedConnections[1]
    const component = render(<StatusIcon connection={injectedConnection} showMiniIcons={false} />)
    expect(component.getByTestId('StatusIconRoot').children.length).toEqual(0)
  })
})
