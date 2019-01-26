import React, { Component, Fragment } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withNamespaces } from 'react-i18next';
import { dismissBetaMessage } from '../../ducks/app';
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
    const { t, showBetaMessage, className, dismissBetaMessage } = this.props;
    return (
      <div>
        <Tabs className={className}>
          { this.renderTab(t("swap"), '/swap', /swap/) }
          { this.renderTab(t("send"), '/send', /send/) }
          { this.renderTab(t("pool"), '/add-liquidity', /add-liquidity|remove-liquidity|create-exchange/) }
        </Tabs>
        <Alert
          message={(
            <div>
              💀 {t("betaWarning")}
              <Link to="/terms-of-service">
                Terms of Service
              </Link>
            </div>
          )}
          type="warning"
          closable
        />
        <Alert
          message="Currently, swaps and sends are disabled while we allow users to add liquidity and get familiar with the site."
          type="warning"
          closable
        />
      </div>
    );
  }
}

export default withRouter(
  connect(
    state => ({
      showBetaMessage: state.app.showBetaMessage,
    }),
    dispatch => ({
      dismissBetaMessage: () => dispatch(dismissBetaMessage()),
    }),
  )(withNamespaces()(NavigationTabs))
);
