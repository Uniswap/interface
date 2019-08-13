import React, { Suspense, lazy, useEffect } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route, Redirect } from 'react-router-dom'
import { getQueryParam } from '../../utils'
import ModeSelector from './ModeSelector'

const AddLiquidity = lazy(() => import('./AddLiquidity'))
const RemoveLiquidity = lazy(() => import('./RemoveLiquidity'))
const CreateExchange = lazy(() => import('./CreateExchange'))

export default function Pool({ location }) {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  const recipient = getQueryParam(location, 'recipient')
  const inputCurrency = getQueryParam(location, 'inputCurrency')
  const outputCurrency = getQueryParam(location, 'outputCurrency')
  const slippage = getQueryParam(location, 'slippage')
  const exactField = getQueryParam(location, 'exactField')
  const exactAmount = getQueryParam(location, 'exactAmount')

  const AddLiquidityParams = () => (
    <AddLiquidity
      outputCurrencyURL={outputCurrency}
      inputCurrencyURL={inputCurrency}
      slippageURL={slippage}
      recipientURL={recipient}
      exactFieldURL={exactField}
      exactAmountURL={exactAmount}
    />
  )

  return (
    <>
      <ModeSelector />
      {/* this Suspense is for route code-splitting */}
      <Suspense fallback={null}>
        <Switch>
          <Route exact strict path="/add-liquidity" component={AddLiquidityParams} />
          <Route exact strict path="/remove-liquidity" component={RemoveLiquidity} />
          <Route exact strict path="/create-exchange" component={CreateExchange} />
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
