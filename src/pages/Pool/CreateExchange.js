import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {selectors} from "../../ducks/web3connect";
import classnames from "classnames";
import NavigationTabs from "../../components/NavigationTabs";
import ModeSelector from "./ModeSelector";
import AddressInputPanel from "../../components/AddressInputPanel";
import OversizedPanel from "../../components/OversizedPanel";
import FACTORY_ABI from "../../abi/factory";
import {addExchange} from "../../ducks/addresses";
import ReactGA from "react-ga";

class CreateExchange extends Component {
  static propTypes = {
    web3: PropTypes.object,
    selectors: PropTypes.func.isRequired,
    addExchange: PropTypes.func.isRequired,
    account: PropTypes.string,
    isConnected: PropTypes.bool.isRequired,
    factoryAddress: PropTypes.string.isRequired,
    exchangeAddresses: PropTypes.shape({
      fromToken: PropTypes.object.isRequired,
    }).isRequired,
  };

  state = {
    tokenAddress: '',
    label: '',
    decimals: 0,
  };

  validate() {
    const { tokenAddress } = this.state;
    const {
      web3,
      account,
      selectors,
      factoryAddress,
      exchangeAddresses: { fromToken },
      addExchange,
    } = this.props;

    let isValid = true;
    let errorMessage = '';

    if (!tokenAddress) {
      return {
        isValid: false,
      };
    }

    if (!web3.utils.isAddress(tokenAddress)) {
      return {
        isValid: false,
        errorMessage: 'Not a valid token address',
      };
    }

    const { label, decimals } = selectors().getBalance(account, tokenAddress);
    const factory = new web3.eth.Contract(FACTORY_ABI, factoryAddress);
    const exchangeAddress = fromToken[tokenAddress];

    if (!exchangeAddress) {
      factory.methods.getExchange(tokenAddress).call((err, data) => {
        if (!err && data !== '0x0000000000000000000000000000000000000000') {
          addExchange({ label, tokenAddress, exchangeAddress: data });
        }
      });
    } else {
      errorMessage = `Already has an exchange for ${label}`;
    }

    if (!label) {
      errorMessage = 'Invalid symbol';
    }

    if (!decimals) {
      errorMessage = 'Invalid decimals';
    }

    return {
      isValid: isValid && !errorMessage,
      errorMessage,
    };
  }

  onChange = tokenAddress => {
    const { selectors, account, web3 } = this.props;
    if (web3.utils.isAddress(tokenAddress)) {
      const { label, decimals } = selectors().getBalance(account, tokenAddress);
      this.setState({
        label,
        decimals,
        tokenAddress,
      });
    } else {
      this.setState({
        label: '',
        decimals: 0,
        tokenAddress,
      });
    }
  };

  onCreateExchange = () => {
    const { tokenAddress } = this.state;
    const { account, web3, factoryAddress } = this.props;

    if (!web3.utils.isAddress(tokenAddress)) {
      return;
    }

    const factory = new web3.eth.Contract(FACTORY_ABI, factoryAddress);
    factory.methods.createExchange(tokenAddress).send({ from: account }, (err, data) => {
      if (!err) {
        this.setState({
          label: '',
          decimals: 0,
          tokenAddress: '',
        });
        ReactGA.event({
          category: 'Pool',
          action: 'CreateExchange',
        });
      }
    })
  };

  renderSummary() {
    const { tokenAddress } = this.state;
    const { errorMessage } = this.validate();

    if (!tokenAddress) {
      return (
        <div className="create-exchange__summary-panel">
          <div className="create-exchange__summary-text">Enter a token address to continue</div>
        </div>
      )
    }

    if (errorMessage) {
      return (
        <div className="create-exchange__summary-panel">
          <div className="create-exchange__summary-text">{errorMessage}</div>
        </div>
      )
    }

    return null;
  }

  render() {
    const { tokenAddress } = this.state;
    const { isConnected, account, selectors, web3 } = this.props;
    const { isValid, errorMessage } = this.validate();
    let label, decimals;

    if (web3 && web3.utils && web3.utils.isAddress(tokenAddress)) {
      const { label: _label, decimals: _decimals } = selectors().getBalance(account, tokenAddress);
      label = _label;
      decimals = _decimals;
    }

    return (
      <div
        key="content"
        className={classnames('swap__content', {
          'swap--inactive': !isConnected,
        })}
      >
        <NavigationTabs
          className={classnames('header__navigation', {
            'header--inactive': !isConnected,
          })}
        />
        <ModeSelector title="Create Exchange" />
        <AddressInputPanel
          title="Token Address"
          value={tokenAddress}
          onChange={this.onChange}
          errorMessage={errorMessage}
        />
        <OversizedPanel hideBottom>
          <div className="pool__summary-panel">
            <div className="pool__exchange-rate-wrapper">
              <span className="pool__exchange-rate">Label</span>
              <span>{label || ' - '}</span>
            </div>
            <div className="pool__exchange-rate-wrapper">
              <span className="swap__exchange-rate">Decimals</span>
              <span>{decimals || ' - '}</span>
            </div>
          </div>
        </OversizedPanel>
        <div className="pool__cta-container">
          <button
            className={classnames('pool__cta-btn', {
              'swap--inactive': !isConnected,
            })}
            disabled={!isValid}
            onClick={this.onCreateExchange}
          >
            Create Exchange
          </button>
        </div>
        { this.renderSummary() }
      </div>
    );
  }
}

export default connect(
  state => ({
    isConnected: Boolean(state.web3connect.account) && state.web3connect.networkId == (process.env.REACT_APP_NETWORK_ID||1),
    account: state.web3connect.account,
    balances: state.web3connect.balances,
    web3: state.web3connect.web3,
    exchangeAddresses: state.addresses.exchangeAddresses,
    factoryAddress: state.addresses.factoryAddress,
  }),
  dispatch => ({
    selectors: () => dispatch(selectors()),
    addExchange: opts => dispatch(addExchange(opts)),
  })
)(CreateExchange);