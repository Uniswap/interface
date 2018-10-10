import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { updateBalance } from '../../ducks/web3';

class Watcher extends Component {
  state = {
    watchlist: {},
  };

  componentWillMount() {
    this.startWatching();
  }

  componentWillUnmount() {
  }

  add(address) {
    const { watchlist } = this.state;
    this.setState({
      ...watchlist,
      [address]: true,
    });
  }

  remove(address) {
    const { watchlist } = this.state;
    this.setState({
      ...watchlist,
      [address]: false,
    });
  }

  startWatching() {
    if (this.interval) {
      clearInterval(this.interval);
      return;
    }

    this.interval = setInterval(() => {
      this.props.updateBalance();
      Object.keys(this.state.watchlist).forEach(address => {

      });
    }, 15000);
  }

  stopWatching() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    return <noscript />;
  }

}

export default connect(
  null,
  dispatch => ({
    updateBalance: () => dispatch(updateBalance()),
  }),
)(Watcher);
