import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import './tab.scss';

export const Tabs = props => {
  return (
    <div className={classnames("tabs", props.className)}>
      { props.children }
    </div>
  );
};

export const Tab = props => {
  return (
    <div
      className={classnames("tab", {
        'tab--selected': props.isSelected,
      })}
      onClick={props.onClick}
    >
      { props.text ? <span>{props.text}</span> : null }
    </div>
  );
};

Tab.propTypes = {
  className: PropTypes.string,
  text: PropTypes.string,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
};

Tab.defaultProps = {
  className: '',
};

