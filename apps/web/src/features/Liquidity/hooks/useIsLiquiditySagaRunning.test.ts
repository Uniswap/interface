import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import { type ComponentProps, createElement, type PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { getMonitoredSagaReducers, SagaStatus } from 'uniswap/src/utils/saga'
import { useIsLiquiditySagaRunning } from '~/features/Liquidity/hooks/useIsLiquiditySagaRunning'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'

function renderWithStore() {
  const store = configureStore({
    reducer: { saga: getMonitoredSagaReducers({ [liquiditySaga.name]: liquiditySaga }) },
  })
  const wrapper = ({ children }: PropsWithChildren) =>
    createElement(Provider, { store } as ComponentProps<typeof Provider>, children)
  return { store, ...renderHook(() => useIsLiquiditySagaRunning(), { wrapper }) }
}

describe('useIsLiquiditySagaRunning', () => {
  it('is false before the saga has ever run', () => {
    const { result } = renderWithStore()

    expect(result.current).toBe(false)
  })

  it('is true only while the saga status is Started', () => {
    const { store, result } = renderWithStore()

    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Started))
    })
    expect(result.current).toBe(true)

    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Success))
    })
    expect(result.current).toBe(false)
  })

  it('is false once the run errors, is cancelled or is reset', () => {
    const { store, result } = renderWithStore()

    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Started))
      store.dispatch(liquiditySaga.actions.error('Action timed out.'))
    })
    expect(result.current).toBe(false)

    act(() => {
      store.dispatch(liquiditySaga.actions.progress(SagaStatus.Started))
      store.dispatch(liquiditySaga.actions.reset())
    })
    expect(result.current).toBe(false)
  })
})
