import { fireEvent, render, screen } from 'test-utils/render'

import Expand from './index'

describe('Expand', () => {
  it('renders correctly', () => {
    const { asFragment } = render(
      <Expand header={<span>Header</span>} button={<span>Button</span>}>
        Body
      </Expand>
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('toggles children on button press', () => {
    render(
      <Expand header={<span>Header</span>} button={<span>Button</span>}>
        Body
      </Expand>
    )

    const button = screen.getByText('Button')

    fireEvent.click(button)
    expect(screen.queryByText('Body')).not.toBeNull()

    fireEvent.click(button)
    expect(screen.queryByText('Body')).toBeNull()
  })
})
