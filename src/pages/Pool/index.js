import React, { useEffect } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route, Redirect } from 'react-router-dom'

import ModeSelector from './ModeSelector'
import AddLiquidity from './AddLiquidity'
import CreateExchange from './CreateExchange'
import RemoveLiquidity from './RemoveLiquidity'

import './pool.scss'

export default function Pool() {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  return (
    <>
      <ModeSelector />
      <Switch>
        <Route exact strict path="/add-liquidity" component={AddLiquidity} />
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
    </>
  )
}
