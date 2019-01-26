import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Redirect, Route } from 'react-router-dom';
import MediaQuery from 'react-responsive';
import { AnimatedSwitch } from 'react-router-transition';
import { Web3Connect, startWatching, initialize } from '../ducks/web3connect';
import { setAddresses } from '../ducks/addresses';
import { Modal, Button } from 'antd';
import Header from '../components/Header';
import Swap from './Swap';
import Send from './Send';
import Pool from './Pool';
import Tos from './Tos';

import './App.scss';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    };

    this.handleOk = this.handleOk.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  componentWillMount() {
    const { initialize, startWatching } = this.props;
    const tos = JSON.parse(localStorage.getItem('tos'));

    if (typeof window.thor !== 'undefined') {
      initialize().then(startWatching);
    } else {
      initialize(true).then(startWatching);
    }

    if (!tos) {
      this.setState({ visible: true });
    }
  }

  componentWillUpdate() {
    const { web3, setAddresses } = this.props;

    if (this.hasSetNetworkId || !web3 || !web3.eth || !web3.eth.getChainTag) {
      return;
    }

    web3.eth.getChainTag()
      .then(chainTagHex => {
        const chainTag = parseInt(chainTagHex, 16)
        setAddresses(chainTag);
        this.hasSetNetworkId = true;
      });
  }

  handleOk() {
    localStorage.setItem('tos', true);
    this.setState({ visible: false });
  }

  handleCancel() {
    this.setState({ visible: false });
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

          </Fragment>
        </BrowserRouter>
        <div>
          <Modal
            title="Terms of Service"
            visible={this.state.visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
          >
            <p>
              The Vexchange contracts and front-end are open source works that are licensed under GNU. This software is provided without any guarantees or liability, the code and licenses can be reviewed <a href="https://github.com/Monti/vexchange" traget="_blank">here</a>. The Vexchange site is simply an interface to an exchange running on the VeChain blockchain. We do not endorse any of the tokens and are not licensed to give investment advice. You acknowledge that you use this software at your own risk, both in terms of security and financial loss.
            </p>
          </Modal>
        </div>
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
