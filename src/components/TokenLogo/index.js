import React, { Component } from 'react'
import PropTypes from 'prop-types'
import EthereumLogo from '../../assets/images/ethereum-logo.svg'

const RINKEBY_TOKEN_MAP = {
  '0xDA5B056Cfb861282B4b59d29c9B395bcC238D29B': '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
  '0x2448eE2641d78CC42D7AD76498917359D961A783': '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
  '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  '0x879884c3C46A24f56089f3bBbe4d5e38dB5788C0': '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
  '0xF22e3F33768354c9805d046af3C0926f27741B43': '0xe41d2489571d322189246dafa5ebde1f4699f498'
}

const TOKEN_ICON_API = 'https://raw.githubusercontent.com/TrustWallet/tokens/master/tokens'
const BAD_IMAGES = {}
export default class TokenLogo extends Component {
  static propTypes = {
    address: PropTypes.string,
    size: PropTypes.string,
    className: PropTypes.string
  }

  static defaultProps = {
    address: '',
    size: '1rem',
    className: ''
  }

  state = {
    error: false
  }

  render() {
    const { address, size, className } = this.props
    // let path = GenericTokenLogo;
    let path = ''
    const mainAddress = RINKEBY_TOKEN_MAP[address] ? RINKEBY_TOKEN_MAP[address] : address

    if (mainAddress === 'ETH') {
      path = EthereumLogo
    }

    if (!this.state.error && !BAD_IMAGES[mainAddress] && mainAddress !== 'ETH') {
      path = `${TOKEN_ICON_API}/${mainAddress.toLowerCase()}.png`
    }

    if (!path) {
      return (
        <div className={className} style={{ width: size, fontSize: size }}>
          <span role="img" aria-label="thinking">
            🤔
          </span>
        </div>
      )
    }

    return (
      <img
        alt="images"
        src={path}
        className={className}
        style={{
          width: size,
          height: size
        }}
        onError={() => {
          this.setState({ error: true })
          BAD_IMAGES[mainAddress] = true
        }}
      />
    )
  }
}
