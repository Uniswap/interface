import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { withNamespaces } from 'react-i18next';
import {selectors, addPendingTx} from "../../ducks/web3connect";
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

  constructor(props) {
    super(props);
    const { match: { params: { tokenAddress } } } = this.props;

    this.state = {
      tokenAddress,
      label: '',
      decimals: 0,
    };
  }

  validate() {
    const { tokenAddress } = this.state;
    const {
      t,
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

    if (web3 && web3.utils && !web3.utils.isAddress(tokenAddress)) {
      return {
        isValid: false,
        errorMessage: t("invalidTokenAddress"),
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
      errorMessage = t("exchangeExists", { label });
    }

    if (!label) {
      errorMessage = t("invalidSymbol");
    }

    if (!decimals) {
      errorMessage = t("invalidDecimals");
    }

    return {
      isValid: isValid && !errorMessage,
      errorMessage,
    };
  }

  onChange = tokenAddress => {
    const { selectors, account, web3 } = this.props;
    if (web3 && web3.utils && web3.utils.isAddress(tokenAddress)) {
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

    if (web3 && web3.utils && !web3.utils.isAddress(tokenAddress)) {
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
        this.props.addPendingTx(data);
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
          <div className="create-exchange__summary-text">{this.props.t("enterTokenCont")}</div>
        </div>
      )
    }

    if (errorMessage) {
      return (
        <div className="create-exchange__summary-panel">
          <div className="create-exchange__summary-text create-exchange--error">{errorMessage}</div>
        </div>
      )
    }

    return null;
  }

  render() {
    const { tokenAddress } = this.state;
    const { t, isConnected, account, selectors, web3 } = this.props;
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
        <ModeSelector title={t("createExchange")} />
        <AddressInputPanel
          title={t("tokenAddress")}
          value={tokenAddress}
          onChange={this.onChange}
          errorMessage={errorMessage}
        />
        <OversizedPanel hideBottom>
          <div className="pool__summary-panel">
            <div className="pool__exchange-rate-wrapper">
              <span className="pool__exchange-rate">{t("label")}</span>
              <span>{label || ' - '}</span>
            </div>
            <div className="pool__exchange-rate-wrapper">
              <span className="swap__exchange-rate">{t("decimals")}</span>
              <span>{decimals || ' - '}</span>
            </div>
          </div>
        </OversizedPanel>
        { this.renderSummary() }
        <div className="pool__cta-container">
          <button
            className={classnames('pool__cta-btn', {
              'swap--inactive': !isConnected,
            })}
            disabled={!isValid}
            onClick={this.onCreateExchange}
          >
            {t("createExchange")}
          </button>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(
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
      addPendingTx: id => dispatch(addPendingTx(id)),
    })
  )(withNamespaces()(CreateExchange))
);
