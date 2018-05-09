import React, { Component } from 'react';
import { connect } from 'react-redux';

import Invest from './Invest';

class Links extends Component {
  render () {
    return(
      <div>
        <section className="links"  ref={(section) => { this.props.location.Links = section; }} >
          <a onClick={() => {this.props.toggleInvest()}} className="link border pa2 f-a">
            <p className="underline">Invest liquidity to collect fees</p>
            <p>↘</p>
          </a>
        </section>
        <Invest
          toggled={this.props.web3Store.investToggle}
          token={this.props.exchange.investToken}
          symbolToTokenContract={this.props.symbolToTokenContract}
          symbolToExchangeContract={this.props.symbolToExchangeContract}
          symbolToExchangeAddress={this.props.symbolToExchangeAddress}
        />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  web3Store: state.web3Store,
  exchange: state.exchange
});

export default connect (mapStateToProps) (Links);
