import { useIsMobile, useIsTablet } from 'nft/hooks'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import CurrencyInputPanel from './index'

jest.mock('nft/hooks')

const CurrencyInputPanelProps = {
  value: '',
  onUserInput: () => null,
  showMaxButton: false,
  id: '',
}

describe('Currency input panel', () => {
  beforeEach(() => {
    mocked(useIsMobile).mockReturnValue(false)
    mocked(useIsTablet).mockReturnValue(false)
  })

  it('Should render with "Select token"', () => {
    const { container } = render(<CurrencyInputPanel {...CurrencyInputPanelProps} />)

    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Select token')
  })
})
