import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';

import QrCode from '../QrCode';
import './address-input-panel.scss';

class AddressInputPanel extends Component {
  static propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    extraText: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.string,
  };

  static defaultProps = {
    onChange() {},
    value: '',
  };

  render() {
    const {
      title,
      description,
      extraText,
      onChange,
      value
    } = this.props;

    return (
      <div className="currency-input-panel">
        <div className="currency-input-panel__container address-input-panel__recipient-row">
          <div className="address-input-panel__input-container">
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
                onChange={e => onChange(e.target.value)}
                value={value}
              />
            </div>
          </div>
          <div className="address-input-panel__qr-container">
            <QrCode onValueReceived={value => onChange(value)} />
          </div>
        </div>
      </div>
    )
  }
}

export default drizzleConnect(AddressInputPanel);
