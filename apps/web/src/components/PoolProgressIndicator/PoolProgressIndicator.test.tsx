import { PoolProgressIndicator } from 'components/PoolProgressIndicator/PoolProgressIndicator'
import { render } from 'test-utils/render'

describe('PoolProgressIndicator', () => {
  it('should render with valid number of steps', () => {
    const { getByText } = render(
      <PoolProgressIndicator
        steps={[
          { label: 'step one', active: true },
          { label: 'step two', active: false },
        ]}
      />,
    )
    expect(getByText('1')).toBeInTheDocument()
    expect(getByText('2')).toBeInTheDocument()
    expect(getByText('step one')).toBeInTheDocument()
    expect(getByText('step two')).toBeInTheDocument()
  })

  it('should throw an error if no steps are provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      render(<PoolProgressIndicator steps={[]} />)
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error).toEqual(new Error('PoolProgressIndicator: steps must have at least one step'))
    }
  })
})
