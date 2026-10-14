import { act, render, screen } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import type { ComponentProps } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import type { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { TableNetworkFilter } from '~/pages/Explore/NetworkFilter'
import { mocked } from '~/test-utils/mocked'
import { getChainUrlParam } from '~/utils/params/chainParams'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(() => false),
  useIsTokenCategoriesEnabled: vi.fn(),
}))

// The dropdown UI is covered elsewhere; here only the URL a network pick navigates to matters.
let filterProps: ComponentProps<typeof NetworkFilter> | undefined
vi.mock('~/components/NetworkFilter/NetworkFilter', () => ({
  NetworkFilter: (props: ComponentProps<typeof NetworkFilter>) => {
    filterProps = props
    return null
  },
}))

function LocationProbe(): JSX.Element {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{`${pathname}${search}`}</span>
}

function Harness(): JSX.Element {
  return (
    <>
      <TableNetworkFilter />
      <LocationProbe />
    </>
  )
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/explore" element={<Harness />}>
          <Route path=":tab" element={<Harness />} />
          <Route path=":tab/:chainName" element={<Harness />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function pickNetwork(chainId: UniverseChainId | undefined): void {
  act(() => filterProps?.onPress(chainId))
}

describe('TableNetworkFilter', () => {
  beforeEach(() => {
    filterProps = undefined
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(true)
  })

  it('keeps the category when picking an EVM network', () => {
    renderAt('/explore/tokens?category=defi')

    pickNetwork(UniverseChainId.Base)

    expect(screen.getByTestId('location').textContent).toBe(
      `/explore/tokens/${getChainUrlParam(UniverseChainId.Base)}?category=defi`,
    )
  })

  it('drops the category when picking Solana, which has no category coverage', () => {
    renderAt('/explore/tokens?category=defi&foo=bar')

    pickNetwork(UniverseChainId.Solana)

    expect(screen.getByTestId('location').textContent).toBe(
      `/explore/tokens/${getChainUrlParam(UniverseChainId.Solana)}?foo=bar`,
    )
  })

  it('drops a stale category when leaving Solana for an EVM network', () => {
    renderAt(`/explore/tokens/${getChainUrlParam(UniverseChainId.Solana)}?category=stocks`)

    pickNetwork(UniverseChainId.Base)

    expect(screen.getByTestId('location').textContent).toBe(`/explore/tokens/${getChainUrlParam(UniverseChainId.Base)}`)
  })

  it('keeps the category on Solana with token categories off', () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)
    renderAt('/explore/tokens?category=stocks')

    pickNetwork(UniverseChainId.Solana)

    expect(screen.getByTestId('location').textContent).toBe(
      `/explore/tokens/${getChainUrlParam(UniverseChainId.Solana)}?category=stocks`,
    )
  })
})
