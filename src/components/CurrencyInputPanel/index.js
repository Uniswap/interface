import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import './currency-panel.scss';

class CurrencyInputPanel extends Component {
  render() {
    return (
      <div className="currency-input-panel">
        <div></div>
        <div className="currency-input-panel__container">
          <div className="currency-input-panel__label-row">
            <div className="currency-input-panel__label-container">
              <span className="currency-input-panel__label">Input</span>
              <span className="currency-input-panel__label-description">(estimated)</span>
            </div>
            <span className="currency-input-panel__extra-text">Balance: 0.03141</span>
          </div>
          <div className="currency-input-panel__input-row">
            <input type="number" className="currency-input-panel__input" placeholder="0.0" />
            <button className="currency-input-panel__currency-select">
              Select a token
              <span className="currency-input-panel__dropdown-icon" />
            </button>
          </div>
        </div>
        <div></div>
      </div>
    )
  }
}

export default connect()(CurrencyInputPanel);
