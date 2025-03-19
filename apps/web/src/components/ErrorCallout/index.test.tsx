import { ErrorCallout } from 'components/ErrorCallout'
import { render } from 'test-utils/render'

describe('ErrorCallout', () => {
  it('should render defaults', () => {
    const { asFragment, getByText } = render(<ErrorCallout errorMessage="test" onPress={() => {}} />)

    expect(getByText('Something went wrong')).toBeInTheDocument()
    expect(getByText('There was an error fetching data required for your transaction.')).toBeInTheDocument()
    expect(getByText('Try again')).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })

  it('should not render errorMessage if true', () => {
    const { asFragment, queryByText } = render(<ErrorCallout errorMessage={true} />)

    expect(queryByText('Error:')).not.toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })
})
