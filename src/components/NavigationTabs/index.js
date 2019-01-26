import React, { Component, Fragment } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withNamespaces } from 'react-i18next';
import { 
  dismissBetaMessage,
  dismissDisabledMessage
 } from '../../ducks/app';
import {Tab, Tabs} from "../Tab";
import { Alert } from 'antd';

import './beta-message.scss';

class NavigationTabs extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }),
    className: PropTypes.string,
    dismissBetaMessage: PropTypes.func.isRequired,
    dismissDisabledMessage: PropTypes.func.isRequired,
    showBetaMessage: PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedPath: this.props.location.pathname,
      className: '',
      showWarning: true,
    };
  }

  renderTab(name, path, regex) {
    const { push } = this.props.history;
    return (
      <Tab
        text={name}
        onClick={() => push(path)}
        isSelected={regex.test(this.props.location.pathname)}
      />
    )
  }

  render() {
    const {
      t,
      showBetaMessage,
      showDisabledMessage,
      className,
      dismissBetaMessage,
      dismissDisabledMessage
    } = this.props;
    return (
      <div>
        <Tabs className={className}>
          { this.renderTab(t("swap"), '/swap', /swap/) }
          { this.renderTab(t("send"), '/send', /send/) }
          { this.renderTab(t("pool"), '/add-liquidity', /add-liquidity|remove-liquidity|create-exchange/) }
        </Tabs>
        { showBetaMessage &&
          <Alert
            message={(
              <div>
                💀 {t("betaWarning")}
                &nbsp;
                <Link to="/terms-of-service">
                  Terms of Service
                </Link>
              </div>
            )}
            onClose={dismissBetaMessage}
            type="error"
            closable
          />
        }
        {
          showDisabledMessage &&
          <Alert
            message="Currently, swaps and sends are disabled while we allow users to add liquidity and get familiar with the site."
            type="error"
            onClose={dismissDisabledMessage}
            closable
          />
        }
      </div>
    );
  }
}

export default withRouter(
  connect(
    state => ({
      showBetaMessage: state.app.showBetaMessage,
      showDisabledMessage: state.app.showDisabledMessage,
    }),
    dispatch => ({
      dismissBetaMessage: () => dispatch(dismissBetaMessage()),
      dismissDisabledMessage: () => dispatch(dismissDisabledMessage()),
    }),
  )(withNamespaces()(NavigationTabs))
);
