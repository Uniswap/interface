import { fireEvent } from '@testing-library/react-native'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures/events'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { HomeScreenEarningSection } from 'wallet/src/features/earn/HomeScreenEarningSection'
import { renderWithProviders } from 'wallet/src/test/render'

const EVM_ADDRESS = '0x0000000000000000000000000000000000000001'

const mockUseQuery = vi.fn()
const mockRefetch = vi.fn(() => Promise.resolve())

vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useQuery: (): unknown => mockUseQuery(),
}))

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: (): boolean => true,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/earn/queries', () => ({
  getListEarnPositionsQueryOptions: (): Record<string, unknown> => ({}),
}))

describe(HomeScreenEarningSection, () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
    mockRefetch.mockClear()
  })

  it('renders the error card with a working retry when positions fail to load', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isError: true, isPlaceholderData: false, refetch: mockRefetch })

    const { getByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(getByTestId(TestID.HomeEarningError)).toBeTruthy()

    fireEvent.press(getByTestId(TestID.HomeEarningErrorRetry), ON_PRESS_EVENT_PAYLOAD)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('renders nothing when there are no positions and no error', () => {
    mockUseQuery.mockReturnValue({
      data: { positions: [] },
      isError: false,
      isPlaceholderData: false,
      refetch: mockRefetch,
    })

    const { queryByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(queryByTestId(TestID.HomeEarningError)).toBeNull()
  })
})
