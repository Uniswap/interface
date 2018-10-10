import React, { Component }from 'react';
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { subscribe } from 'redux-subscriber';
import { setWeb3ConnectionStatus, setInteractionState, setNetworkMessage, metamaskLocked } from '../ducks/addresses';

class NetworkStatus extends Component {
  componentDidMount(){
    // eslint-disable-next-line no-unused-vars
    const interactionStateSubscriber = subscribe('web3Store.currentMaskAddress', state => {
      if (state.web3Store.currentMaskAddress !== undefined) {
        // console.log('METAMASK UNLOCKED FROM NETWORK STATUS')
        this.checkNetwork();
      } else { console.log('METAMASK LOCKED') }
    })
  }

  checkNetwork = () => {
    this.props.web3Store.web3.eth.net.getNetworkType((err, networkId) => {
      console.log("Connected to " + networkId)
      let interactionState = networkId === 'rinkeby' ? 'connected' : 'disconnected';
      let connectionStatus = networkId === 'rinkeby' ? true : false;
      this.props.setNetworkMessage(networkId);
      this.props.setWeb3ConnectionStatus(connectionStatus);
      this.props.setInteractionState(interactionState);
    })
  }

  render () {
    if (this.props.web3Store.connected && this.props.web3Store.interaction !== 'disconnected'){
      return (
        <div className="connection border pa2 green">
            <p className="userBalance">{this.props.exchange.inputToken.value + ": " + (this.props.exchange.inputBalance/10**18).toFixed(2)}</p>
            <p className="userBalance">{this.props.exchange.outputToken.value + ": " + (this.props.exchange.outputBalance/10**18).toFixed(2)}</p>
          <a target="_blank" rel="noopener noreferrer" href={'https://rinkeby.etherscan.io/search?q=' + this.props.web3Store.currentMaskAddress}>{this.props.web3Store.currentMaskAddress}</a>
          <p>●</p>
        </div>
      )
    } else if (!this.props.metamask) {
      return (
        <div className="connection red border pa2">
          <p>{"Waiting for connection to the blockchain..."}</p>
          <p>●</p>
        </div>
      )
    } else if (this.props.web3Store.metamaskLocked && !this.props.web3Store.connected) {
      return (
        <div className="connection yellow border pa2">
          <p>{"Waiting for Metamask to unlock..."}</p>
          <p>●</p>
        </div>
      )
    } else {
      return (
        <div className="connection yellow border pa2">
          <p>{'MetaMask connected to ' + this.props.web3Store.networkMessage + '. Please switch to Rinkeby!'}</p>
          <p>●</p>
        </div>
      )
    }
  }
}
const mapStateToProps = state => ({
  global: state.global,
  web3Store: state.web3Store,
  exchange: state.exchange
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    setWeb3ConnectionStatus,
    setInteractionState,
    setNetworkMessage,
    metamaskLocked
  }, dispatch)
}

export default connect (mapStateToProps, mapDispatchToProps)(NetworkStatus);
