import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EthereumLogo from '../../assets/images/ethereum-logo.png';
import GenericTokenLogo from '../../assets/images/generic-token-logo.png';

const TOKEN_ICON_API = 'https://raw.githubusercontent.com/TrustWallet/tokens/master/images';

export default class TokenLogo extends Component {
  static propTypes = {
    address: PropTypes.string,
    size: PropTypes.string,
    className: PropTypes.string,
  };

  static defaultProps = {
    address: '',
    size: '1.5rem',
    className: '',
  };

  state = {
    error: false,
  };

  render() {
    const { address, size, className } = this.props;
    let path = GenericTokenLogo;

    if (address === 'ETH') {
      path = EthereumLogo;
    }

    if (!this.state.error) {
      path = `${TOKEN_ICON_API}/${address}.png`;
    }


    return (
      <img
        src={path}
        className={className}
        style={{
          width: size,
          height: size,
        }}
        onError={() => this.setState({ error: true })}
      />
    );
  }
}
