import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import PropTypes from 'prop-types';
import c from 'classnames';

import QrCode from '../QrCode';
import './address-input-panel.scss';

class AddressInputPanel extends Component {
  static propTypes = {
    title: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.string,
    errorMessage: PropTypes.string,
  };

  static defaultProps = {
    onChange() {},
    value: '',
  };

  render() {
    const {
      title,
      onChange,
      value,
      errorMessage,
    } = this.props;

    return (
      <div className="currency-input-panel">
        <div className={c('currency-input-panel__container address-input-panel__recipient-row', {
          'currency-input-panel__container--error': errorMessage,
        })}>
          <div className="address-input-panel__input-container">
            <div className="currency-input-panel__label-row">
              <div className="currency-input-panel__label-container">
                <span className="currency-input-panel__label">{title || 'Recipient Address'}</span>
              </div>
            </div>
            <div className="currency-input-panel__input-row">
              <input
                type="text"
                className={c('address-input-panel__input',{
                  'address-input-panel__input--error': errorMessage,
                })}
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
