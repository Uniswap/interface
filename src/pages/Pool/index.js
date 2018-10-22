import React, { Component } from 'react';
import Header from '../../components/Header';
import AddLiquidity from './AddLiquidity';
import "./pool.scss";

const ADD_LIQUIDITY = 'Add Liquidity';
const REMOVE_LIQUIDITY = 'Remove Liquidity';

class Pool extends Component {
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

export default Pool;
