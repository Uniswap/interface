import React, { useEffect } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route, Redirect } from 'react-router-dom'

import AddLiquidity from './AddLiquidity'
import CreateExchange from './CreateExchange'
import RemoveLiquidity from './RemoveLiquidity'

import './pool.scss'

export default function Pool() {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  return (
    <div className="pool">
      <Switch>
        <Route exact strict path="/pool/add-liquidity" component={AddLiquidity} />
        <Route exact strict path="/pool/remove-liquidity" component={RemoveLiquidity} />
        <Route exact strict path="/pool/create-exchange" component={CreateExchange} />
        <Route
          path="/pool/create-exchange/:tokenAddress"
          render={({ match }) => {
            return (
              <Redirect
                to={{ pathname: '/pool/create-exchange', state: { tokenAddress: match.params.tokenAddress } }}
              />
            )
          }}
        />
        <Redirect to="/pool/add-liquidity" />
      </Switch>
    </div>
  )
}
