import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Redirect, Route } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { AnimatedSwitch } from 'react-router-transition';
import { Web3Connect, startWatching, initialize } from '../ducks/web3connect';
import { setAddresses } from '../ducks/addresses';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Swap from './Swap';
import Send from './Send';
import Pool from './Pool';
import Tos from './Tos';

import './App.scss';

class App extends Component {
  componentDidMount() {
    const { initialize, startWatching } = this.props;

    if (typeof window.thor !== 'undefined') {
      initialize().then(startWatching);
    } else {
      initialize(true).then(startWatching);
    }
  }

  componentWillUpdate() {
    const { web3, setAddresses } = this.props;

    if (this.hasSetNetworkId || !web3 || !web3.eth || !web3.eth.net || !web3.eth.net.getId) {
      return;
    }

    web3.eth.getChainTag()
      .then(chainTagHex => {
        const chainTag = parseInt(chainTagHex, 16)
        setAddresses(chainTag);
        this.hasSetNetworkId = true;
      });
  }

  render() {
    if (!this.props.initialized) {
      return <noscript />;
    }

    return (
      <div id="app-container">
        <MediaQuery query="(min-width: 768px)">
          <Header />
        </MediaQuery>

        <Web3Connect />

        <BrowserRouter>
          <Fragment>
            <AnimatedSwitch
              atEnter={{ opacity: 0 }}
              atLeave={{ opacity: 0 }}
              atActive={{ opacity: 1 }}
              className="app__switch-wrapper"
            >
              <Route exact path="/swap" component={Swap} />
              <Route exact path="/send" component={Send} />
              <Route exact path="/add-liquidity" component={Pool} />
              <Route exact path="/remove-liquidity" component={Pool} />
              <Route exact path="/create-exchange/:tokenAddress?" component={Pool} />
              <Route exact path="/terms-of-service" component={Tos} />
              <Redirect exact from="/" to="/swap" />

            </AnimatedSwitch>

            {/* <Footer /> */}
          </Fragment>
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
    initialize: (initializeArkane) => dispatch(initialize(initializeArkane)),
    startWatching: () => dispatch(startWatching()),
  }),
)(App);
