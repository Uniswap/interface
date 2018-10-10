import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react'
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { AnimatedSwitch } from 'react-router-transition';
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
          <Route component={Swap} />
        </AnimatedSwitch>
      </BrowserRouter>
    );
  }
}

export default drizzleConnect(
  App,
  state => ({
    initialized: state.drizzleStatus.initialized,
  }),
);
