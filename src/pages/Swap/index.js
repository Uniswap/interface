import React, { Component } from 'react';
import { connect } from 'react-redux';
import Header from '../../components/Header';

import "./swap.scss";

class Swap extends Component {
  render() {
    return (
      <div className="swap">
        <Header />
        <div className="swap__content">
        </div>
      </div>
    )
  }
}

export default connect()(Swap);
