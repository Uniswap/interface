import React from 'react';
import PropTypes from 'prop-types';
import { drizzleConnect } from 'drizzle-react'
import classnames from 'classnames';
import Web3 from 'web3';
import Jazzicon from 'jazzicon';
import './web3-status.scss';

function Web3Status(props) {
  const { address } = props;

  return (
    <div
      className={classnames("web3-status", {
        'web3-status__connected': props.isConnected,
      })}
    >
      <div
        className="web3-status__identicon"
        ref={el => {
          if (!el) {
            return;
          }

          if (!address|| address.length < 42 || !Web3.utils.isHexStrict(address)) {
            return;
          }

          el.innerHTML = '';
          el.appendChild(Jazzicon(18, parseInt(address.slice(2), 16)));
        }}
      />
      <div className="web3-status__text">
        { getText(props.address) }
      </div>
    </div>
  )
}

function getText(text) {
  if (!text || text.length < 42 || !Web3.utils.isHexStrict(text)) {
    return 'Disconnected';
  }

  const address = Web3.utils.toChecksumAddress(text);

  return `${address.substring(0, 6)}...${address.substring(38)}`;
}

Web3Status.propTypes = {
  isConnected: PropTypes.bool,
  address: PropTypes.string,
};

Web3Status.defaultProps = {
  isConnected: false,
  address: 'Disconnected',
};

export default drizzleConnect(
  Web3Status,
  state => ({
    address: state.accounts[0],
    isConnected: !!(state.drizzleStatus.initialized && state.accounts[0]),
  })
);
