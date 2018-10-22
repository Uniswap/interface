import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react'
import { BrowserRouter, Switch, Redirect, Route } from 'react-router-dom';
import { AnimatedSwitch } from 'react-router-transition';
import { Web3Connect } from '../ducks/web3connect';
import Swap from './Swap';
import Send from './Send';
import Pool from './Pool';

import './App.scss';

class App extends Component {
  render() {
    if (!this.props.initialized) {
      return <noscript />;
    }

    return (
      <div id="app-container">
        <Web3Connect />
        <BrowserRouter>
          <AnimatedSwitch
            atEnter={{ opacity: 0 }}
            atLeave={{ opacity: 0 }}
            atActive={{ opacity: 1 }}
            className="app__switch-wrapper"
          >
            <Route exact path="/swap" component={Swap} />
            <Route exact path="/send" component={Send} />
            <Route exact path="/pool" component={Pool} />
            <Redirect exact from="/" to="/swap" />
          </AnimatedSwitch>
        </BrowserRouter>
      </div>
    );
  }
}

export default drizzleConnect(
  App,
  state => ({
    initialized: state.drizzleStatus.initialized,
  }),
);
