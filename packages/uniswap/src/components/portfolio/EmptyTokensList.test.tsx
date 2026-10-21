import { EmptyTokensList } from 'uniswap/src/components/portfolio/EmptyTokensList'
import { render } from 'uniswap/src/test/test-utils'

const mocks = vi.hoisted(() => ({
  isMobileApp: true,
  tokenLoaderProps: vi.fn(),
  context: {} as Record<string, unknown>,
}))

vi.mock('@universe/environment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/environment')>()),
  get isMobileApp(): boolean {
    return mocks.isMobileApp
  },
}))

vi.mock('@universe/mycelium', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium')>()
  return {
    ...actual,
    Loader: {
      ...actual.Loader,
      Token: (props: Record<string, unknown>): null => {
        mocks.tokenLoaderProps(props)
        return null
      },
    },
  }
})

vi.mock('uniswap/src/features/portfolio/TokenBalanceListContext', () => ({
  useTokenBalanceListContext: (): Record<string, unknown> => mocks.context,
}))

const LOADING_CONTEXT = { balancesById: undefined, isPending: true, error: undefined, refetch: vi.fn() }

describe('EmptyTokensList', () => {
  beforeEach(() => {
    mocks.tokenLoaderProps.mockClear()
    mocks.context = LOADING_CONTEXT
  })

  it('stacks mobile skeleton rows without a gap so they line up with the real rows', () => {
    mocks.isMobileApp = true

    render(<EmptyTokensList emptyCondition errorCardContainerStyle={{}} />)

    expect(mocks.tokenLoaderProps).toHaveBeenCalledWith(expect.objectContaining({ withPrice: true, gap: '$none' }))
  })

  it('keeps the default skeleton row gap outside the mobile app', () => {
    mocks.isMobileApp = false

    render(<EmptyTokensList emptyCondition errorCardContainerStyle={{}} />)

    expect(mocks.tokenLoaderProps).toHaveBeenCalledWith(expect.objectContaining({ withPrice: true }))
    expect(mocks.tokenLoaderProps.mock.calls[0]?.[0].gap).toBeUndefined()
  })

  it('does not render the skeleton once balances are cached', () => {
    mocks.context = { ...LOADING_CONTEXT, balancesById: {} }

    render(<EmptyTokensList emptyCondition errorCardContainerStyle={{}} />)

    expect(mocks.tokenLoaderProps).not.toHaveBeenCalled()
  })
})
