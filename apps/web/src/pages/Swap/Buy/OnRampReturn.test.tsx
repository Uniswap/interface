import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { ON_RAMP_RETURN_PATH } from '~/pages/Swap/Buy/onRampRedirectUrl'
import { OnRampReturn } from '~/pages/Swap/Buy/OnRampReturn'

function LocationSnapshot(): JSX.Element {
  const { pathname, search } = useLocation()
  return <div data-testid="location-snapshot">{pathname + search}</div>
}

describe('OnRampReturn', () => {
  it('forwards to /buy with the provider query string intact', () => {
    render(
      <MemoryRouter initialEntries={[`${ON_RAMP_RETURN_PATH}?transactionId=123&status=completed`]}>
        <Routes>
          <Route path={ON_RAMP_RETURN_PATH} element={<OnRampReturn />} />
          <Route path="/buy" element={<LocationSnapshot />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location-snapshot').textContent).toBe('/buy?transactionId=123&status=completed')
  })
})
