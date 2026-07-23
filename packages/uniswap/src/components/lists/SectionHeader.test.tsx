import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { render } from 'uniswap/src/test/test-utils'

describe('SectionHeader Stocks', () => {
  it('renders the Stocks title', () => {
    const { getByText } = render(<SectionHeader sectionKey={OnchainItemSectionName.Stocks} />)
    expect(getByText('Stocks')).toBeDefined()
  })

  it('renders the rightElement (NewTag) and mounts the header with the stocks testID', () => {
    const { getByText, getByTestId } = render(
      <SectionHeader sectionKey={OnchainItemSectionName.Stocks} rightElement={<NewTag />} />,
    )
    expect(getByTestId(`${TestID.SectionHeaderPrefix}stocks`)).toBeDefined()
    // The test i18n harness renders translation keys verbatim, so NewTag's `t('common.new')` shows as the key.
    expect(getByText('common.new')).toBeDefined()
  })
})
