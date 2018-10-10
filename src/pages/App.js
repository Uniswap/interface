import React, { Component } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { AnimatedSwitch } from 'react-router-transition';
import { initialize } from '../ducks/web3'
import Watcher from '../components/Watcher';
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
      <div style={{ width: '100%', height: '100%' }}>
        <Watcher />
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
      </div>
    );
  }
}

export default connect(
  null,
  dispatch => ({
    initializeWeb3: () => dispatch(initialize()),
  })
)(App);
