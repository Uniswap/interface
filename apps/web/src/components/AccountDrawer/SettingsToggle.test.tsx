import { LineChartDots } from 'ui/src/components/icons/LineChartDots'
import { SettingsToggle } from '~/components/AccountDrawer/SettingsToggle'
import { act, render } from '~/test-utils/render'

describe('SettingsToggle', () => {
  it('Updates value on click', () => {
    let mockActive = false
    const mockToggle = vi.fn().mockImplementation(() => (mockActive = !mockActive))
    const component = render(
      <SettingsToggle
        dataid="testId"
        title="Test toggle"
        description="Test description"
        isActive={mockActive}
        toggle={mockToggle}
      />,
    )

    expect(component.container).toMatchSnapshot()
    expect(mockActive).toBeFalsy()
    expect(component.container).toHaveTextContent('Test toggle')
    expect(component.container).toHaveTextContent('Test description')

    act(() => component.getByTestId('testId').click())
    expect(mockToggle).toHaveBeenCalledTimes(1)
    expect(mockActive).toBeTruthy()

    act(() => component.getByTestId('testId').click())
    expect(mockToggle).toHaveBeenCalledTimes(2)
    expect(mockActive).toBeFalsy()
  })

  it('renders with icon', () => {
    const { container } = render(
      <SettingsToggle
        icon={<LineChartDots size="$icon.24" color="$neutral2" />}
        title="Allow analytics"
        isActive={true}
        toggle={() => {}}
      />,
    )
    expect(container).toMatchSnapshot()
  })
})
