import React, { Component } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route } from 'react-router-dom'

import AddLiquidity from './AddLiquidity'
import CreateExchange from './CreateExchange'
import RemoveLiquidity from './RemoveLiquidity'

import './pool.scss'

class Pool extends Component {
  componentWillMount() {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }
  render() {
    return (
      <div className="pool">
        <Switch>
          <Route exact path="/add-liquidity" component={AddLiquidity} />
          <Route exact path="/remove-liquidity" component={RemoveLiquidity} />
          <Route exact path="/create-exchange/:tokenAddress?" component={CreateExchange} />
        </Switch>
      </div>
    )
  }
}

export default Pool
