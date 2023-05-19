import { Globals } from 'react-spring'
import { fireEvent, render, screen } from 'test-utils/render'

import Expand from './index'

describe('Expand', () => {
  beforeAll(() => {
    Globals.assign({
      skipAnimation: true,
    })
  })
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
      <Expand testId="expand-component" header={<span>Header</span>} button={<span>Button</span>}>
        Body
      </Expand>
    )

    const button = screen.getByText('Button')
    const content = screen.getByTestId('animated-dropdown-container')

    fireEvent.click(button)
    expect(content).not.toHaveStyleRule('height', '0px')

    fireEvent.click(button)

    expect(content).toHaveStyleRule('height', '0px')
  })
})
