import React, { Component } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { initialize } from '../ducks/web3'
import Swap from './Swap';
import Send from './Send';
import Pool from './Pool';

import './App.scss';

class App extends Component {
  componentWillMount() {
    this.props.initializeWeb3();
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/swap" component={Swap} />
          <Route exact path="/send" component={Send} />
          <Route exact path="/pool" component={Pool} />
        </Switch>
      </BrowserRouter>
    )
  }
}

export default connect(
  ({ web3: { web3, currentAddress } }) => ({
    address: currentAddress,
    isConnected: !!(web3 && currentAddress),
  }),
  dispatch => ({
    initializeWeb3: () => dispatch(initialize()),
  })
)(App);
