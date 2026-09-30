import { SharedEventName } from '@uniswap/analytics-events'
import { TestID } from '@universe/test'
import { useNavigate } from 'react-router'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { CategoryDefinitionSheet } from '~/components/CategoryDefinitionCard/CategoryDefinitionSheet'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: vi.fn(),
}))
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }) =>
    isModalOpen ? <div>{children}</div> : null,
}))

const stocks = tokenCategory({ id: 'stocks', name: 'Stocks', description: 'Tokenized stocks from known issuers' })
const navigate = vi.fn()

describe('CategoryDefinitionSheet', () => {
  beforeEach(() => {
    mocked(useNavigate).mockReturnValue(navigate)
  })

  it('renders nothing while closed', () => {
    render(
      <CategoryDefinitionSheet
        category={stocks}
        isOpen={false}
        section={SectionName.ExploreCategoryChips}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByTestId(TestID.CategoryDefinitionSheet)).not.toBeInTheDocument()
  })

  it('shows the definition and closes from the Close button', () => {
    const onClose = vi.fn()
    render(
      <CategoryDefinitionSheet category={stocks} isOpen section={SectionName.ExploreCategoryChips} onClose={onClose} />,
    )

    expect(screen.getByText('Tokenized stocks from known issuers')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('logs, closes and navigates to Category Details when the definition is pressed', () => {
    const onClose = vi.fn()
    render(
      <CategoryDefinitionSheet category={stocks} isOpen section={SectionName.ExploreCategoryChips} onClose={onClose} />,
    )

    fireEvent.click(screen.getByTestId(TestID.CategoryDefinitionCard))
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CategoryDefinitionSheet,
      section: SectionName.ExploreCategoryChips,
      category_id: 'stocks',
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/explore/category/stocks')
  })
})
