import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { drizzleConnect } from 'drizzle-react';
import Header from '../../components/Header';
import AddLiquidity from './AddLiquidity';
import "./pool.scss";

const ADD_LIQUIDITY = 'Add Liquidity';
const REMOVE_LIQUIDITY = 'Remove Liquidity';

class Pool extends Component {
  static propTypes = {
    // Injected by React Router Dom
    push: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    currentAddress: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
  };

  state = {
    selectedMode: ADD_LIQUIDITY,
  };

  renderContent() {
    switch (this.state.selectedMode) {
      case ADD_LIQUIDITY:
      default:
        return <AddLiquidity />
    }
  }

  render() {
    return (
      <div className="pool">
        <Header />
        { this.renderContent() }
      </div>
    );
  }
}

export default withRouter(
  drizzleConnect(
    Pool,
    (state, ownProps) => ({
      push: ownProps.history.push,
      pathname: ownProps.location.pathname,
      currentAddress: state.accounts[0],
      isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),
    }),
  ),
);
