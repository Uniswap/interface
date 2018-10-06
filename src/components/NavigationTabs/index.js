import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import {Tab, Tabs} from "../Tab";

class NavigationTabs extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }),
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedPath: this.props.location.pathname,
    };
  }

  renderTab(name, path) {
    const { push } = this.props.history;
    const { selectedPath } = this.state;
    return (
      <Tab
        text={name}
        onClick={() => {
          push(path);
          this.setState({ selectedPath: path });
        }}
        isSelected={path === selectedPath }
      />
    )
  }

  render() {
    return (
      <Tabs>
        { this.renderTab('Swap', '/swap') }
        { this.renderTab('Send', '/send') }
        { this.renderTab('Pool', '/pool') }
      </Tabs>
    );
  }
}

export default withRouter(NavigationTabs);
