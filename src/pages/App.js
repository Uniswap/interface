import React, { Component } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Redirect, Route } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { AnimatedSwitch } from 'react-router-transition';
import { Web3Connect, startWatching, initialize } from '../ducks/web3connect';
import { setAddresses } from '../ducks/addresses';
import Header from '../components/Header';
import Swap from './Swap';
import Send from './Send';
import Pool from './Pool';

import './App.scss';

class App extends Component {
  componentWillMount() {
    const { initialize, startWatching} = this.props;
    initialize().then(startWatching);
  };

  componentWillUpdate() {
    const { web3, setAddresses } = this.props;

    if (this.hasSetNetworkId || !web3 || !web3.eth || !web3.eth.net || !web3.eth.net.getId) {
      return;
    }

    web3.eth.net.getId((err, networkId) => {
      if (!err && !this.hasSetNetworkId) {
        setAddresses(networkId);
        this.hasSetNetworkId = true;
      }
    });
  }

  render() {
    if (!this.props.initialized) {
      return <noscript />;
    }

    return (
      <div id="app-container">
        <MediaQuery query="(min-device-width: 768px)">
          <Header />
        </MediaQuery>
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
            <Route path="/pool" component={Pool} />
            <Redirect exact from="/" to="/swap" />
          </AnimatedSwitch>
        </BrowserRouter>
      </div>
    );
  }
}

export default connect(
  state => ({
    account: state.web3connect.account,
    initialized: state.web3connect.initialized,
    web3: state.web3connect.web3,
  }),
  dispatch => ({
    setAddresses: networkId => dispatch(setAddresses(networkId)),
    initialize: () => dispatch(initialize()),
    startWatching: () => dispatch(startWatching()),
  }),
)(App);
