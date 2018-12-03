import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import './tooltip.scss';

export default function Tooltip(props) {
  return (
    <div className={classnames('tooltip', props.className)}>
      <div
        className={classnames('tooltip__tooltip', { hidden: props.disabled })}
        style={props.tooltipStyle}
      >
        {props.content}
      </div>
      {props.children}
    </div>
  );
}

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  tooltipStyle: PropTypes.object,
};

Tooltip.defaultProps = {
  className: '',
  tooltipStyle: {},
  disabled: false,
};
