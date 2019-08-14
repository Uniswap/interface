import React, { Suspense, lazy, useEffect } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route, Redirect } from 'react-router-dom'
import { getQueryParam, isAddress } from '../../utils'
import ModeSelector from './ModeSelector'

const AddLiquidity = lazy(() => import('./AddLiquidity'))
const RemoveLiquidity = lazy(() => import('./RemoveLiquidity'))
const CreateExchange = lazy(() => import('./CreateExchange'))

export default function Pool({ location }) {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  // Add liquidity params
  const ethAmount = !isNaN(getQueryParam(location, 'ethAmount')) ? getQueryParam(location, 'ethAmount') : ''
  const tokenAmount = !isNaN(getQueryParam(location, 'tokenAmount')) ? getQueryParam(location, 'tokenAmount') : ''
  const token = isAddress(getQueryParam(location, 'token')) ? isAddress(getQueryParam(location, 'token')) : ''
  const AddLiquidityParams = () => (
    <AddLiquidity ethAmountURL={ethAmount} tokenAmountURL={tokenAmount} tokenURL={token} />
  )

  // Remove liquidity params
  const poolTokenAmount = !isNaN(getQueryParam(location, 'poolTokenAmount'))
    ? getQueryParam(location, 'poolTokenAmount')
    : ''
  const poolTokenAddress = isAddress(getQueryParam(location, 'poolTokenAddress'))
    ? isAddress(getQueryParam(location, 'poolTokenAddress'))
    : ''
  const RemoveLiquidityParams = () => (
    <RemoveLiquidity poolTokenAddressURL={poolTokenAddress} poolTokenAmountURL={poolTokenAmount} />
  )

  // Create Exchange params
  const tokenAddress = isAddress(getQueryParam(location, 'tokenAddress'))
    ? isAddress(getQueryParam(location, 'tokenAddress'))
    : ''
  const CreateExchangeParams = () => <CreateExchange tokenAddressURL={tokenAddress} />

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
