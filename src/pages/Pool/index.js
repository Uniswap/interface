import React, { Suspense, lazy, useEffect } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route, Redirect } from 'react-router-dom'
import ModeSelector from './ModeSelector'

const AddLiquidity = lazy(() => import('./AddLiquidity'))
const RemoveLiquidity = lazy(() => import('./RemoveLiquidity'))
const CreateExchange = lazy(() => import('./CreateExchange'))

export default function Pool({ params }) {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  const AddLiquidityParams = () => <AddLiquidity params={params} />

  const RemoveLiquidityParams = () => <RemoveLiquidity params={params} />

  const CreateExchangeParams = () => <CreateExchange params={params} />

  return (
    <>
      <ModeSelector />
      {/* this Suspense is for route code-splitting */}
      <Suspense fallback={null}>
        <Switch>
          <Route exact strict path="/add-liquidity" component={AddLiquidityParams} />
          <Route exact strict path="/remove-liquidity" component={RemoveLiquidityParams} />
          <Route exact strict path="/create-exchange" component={CreateExchangeParams} />
          <Route
            path="/create-exchange/:tokenAddress"
            render={({ match }) => {
              return (
                <Redirect to={{ pathname: '/create-exchange', state: { tokenAddress: match.params.tokenAddress } }} />
              )
            }}
          />
          <Redirect to="/add-liquidity" />
        </Switch>
      </Suspense>
    </>
  )
}
