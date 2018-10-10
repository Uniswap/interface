import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';

import './address-input-panel.scss';

class AddressInputPanel extends Component {
  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    extraText: PropTypes.string,
  };

  render() {
    const {
      title,
      description,
      extraText,
    } = this.props;

    return (
      <div className="currency-input-panel">
        <div className="currency-input-panel__container">
          <div className="currency-input-panel__label-row">
            <div className="currency-input-panel__label-container">
              <span className="currency-input-panel__label">Recipient Address</span>
            </div>
          </div>
          <div className="currency-input-panel__input-row">
            <input
              type="text"
              className="address-input-panel__input"
              placeholder="0x1234..."
            />
          </div>
        </div>
      </div>
    )
  }
}

export default drizzleConnect(AddressInputPanel);
