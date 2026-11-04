import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TestID } from '@universe/test'
import HooksPreview from '~/pages/Explore/tables/Hooks/HooksPreview'
import { fireEvent, render, screen, waitFor, within } from '~/test-utils/render'

let queryClient: QueryClient

function renderPreview(scenario = ''): ReturnType<typeof render> {
  window.history.replaceState(null, '', `/explore/hooks?hooksFixtureScenario=${scenario}`)
  return render(
    <QueryClientProvider client={queryClient}>
      <HooksPreview />
    </QueryClientProvider>,
  )
}

describe('Hooks preview', () => {
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('labels sample data and keeps fixture rows inert', async () => {
    renderPreview()

    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Explore hooks on Uniswap'))
    const preview = within(screen.getByTestId(TestID.HooksPreview))
    expect(preview.getByText('Preview · Sample data')).toBeInTheDocument()
    expect(preview.queryByRole('link')).not.toBeInTheDocument()
    expect(preview.queryByRole('button', { name: /create|add liquidity/i })).not.toBeInTheDocument()
  })

  it('pages through fixtures and restores the first page', async () => {
    renderPreview()
    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    const previousButton = screen.getByRole('button', { name: 'Previous' })
    expect(previousButton).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(previousButton)
    expect(screen.getByText('Angstrom')).toBeInTheDocument()

    const nextButton = screen.getByRole('button', { name: 'Next' })
    const navigation = screen.getByRole('navigation', { name: 'Hooks pages' })
    nextButton.focus()
    fireEvent.click(nextButton)
    expect(nextButton).toHaveFocus()
    expect(screen.getByRole('navigation', { name: 'Hooks pages' })).toBe(navigation)
    expect(await screen.findByText('Configured hook preview')).toBeInTheDocument()
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBe(nextButton)
    expect(nextButton).toHaveAttribute('aria-disabled', 'true')
    expect(nextButton).toHaveFocus()
    fireEvent.click(nextButton)
    expect(screen.getByText('Configured hook preview')).toBeInTheDocument()

    previousButton.focus()
    fireEvent.click(previousButton)
    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    expect(previousButton).toHaveFocus()
  })

  it('renders true zero distinctly from unavailable metrics', async () => {
    renderPreview()
    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    const preview = within(screen.getByTestId(TestID.HooksPreview))
    expect(preview.getByText('0')).toBeInTheDocument()
    expect(preview.getAllByText('$0.00')).toHaveLength(2)
    expect(preview.getAllByText('-').length).toBeGreaterThan(0)
    expect(preview.getByText('36')).toBeInTheDocument()
  })

  it.each([
    ['empty', 'No hooks found'],
    ['not-found', 'Hook not found'],
  ])('shows the %s state without another fixture taking its place', async (scenario, title) => {
    renderPreview(scenario)
    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Hooks pages' })).not.toBeInTheDocument()
  })

  it('keeps loading fixtures pending and exposes the loading state', async () => {
    renderPreview('loading')
    await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument())
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
  })

  it('shows a retry action on an error without falling back to successful fixtures', async () => {
    renderPreview('error')
    expect(await screen.findByText('Error loading data')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
  })
})
