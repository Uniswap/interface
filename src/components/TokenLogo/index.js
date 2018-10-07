import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EthereumLogo from '../../assets/images/ethereum-logo.png';

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
    let path = 'https://png2.kisspng.com/sh/59799e422ec61954a8e126f9203cd0b3/L0KzQYm3U8I6N5xniZH0aYP2gLBuTflxcJDzfZ9ubXBteX76gf10fZ9sRdlqbHH7iX7ulfV0e155gNc2cYXog8XwjB50NZR3kdt3Zz3ofbFxib02aZNoetUAYkC6QoXrVr4zP2Y1SKkBNkG4QoO6Ucg1Omg1Sqs8LoDxd1==/kisspng-iphone-emoji-samsung-galaxy-guess-the-questions-crying-emoji-5abcbc5b0724d6.2750076615223184270293.png';

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
