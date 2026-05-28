import { Coins } from 'ui/src/components/icons/Coins'
import { SettingsButton } from '~/components/AccountDrawer/SettingsButton'
import { render } from '~/test-utils/render'

describe('SettingsButton', () => {
  it('renders with icon and current state', () => {
    const { container } = render(
      <SettingsButton
        icon={<Coins size="$icon.24" color="$neutral2" />}
        title="Currency"
        currentState="USD"
        onClick={() => {}}
      />,
    )
    expect(container).toMatchSnapshot()
  })

  it('renders without icon', () => {
    const { container } = render(<SettingsButton title="Storage" onClick={() => {}} />)
    expect(container).toMatchSnapshot()
  })

  it('renders without arrow', () => {
    const { container } = render(<SettingsButton title="Toggle item" showArrow={false} onClick={() => {}} />)
    expect(container).toMatchSnapshot()
  })
})
