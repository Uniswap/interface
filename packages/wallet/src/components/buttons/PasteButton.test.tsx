import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import PasteButton from 'wallet/src/components/buttons/PasteButton'
import { render } from 'wallet/src/test/test-utils'

describe(SplitLogo, () => {
  it('renders without error', () => {
    const tree = render(<PasteButton onPress={(text) => text} />)

    expect(tree).toMatchSnapshot()
  })
  describe('inline', () => {
    it('renders inline button', () => {
      const tree = render(<PasteButton inline onPress={(text) => text} />)

      expect(tree).toMatchSnapshot()
    })
  })
})
