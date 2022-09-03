/*tslint-disable*/
/*eslint-disable*/
import React, { Component } from 'react';

import PropTypes from 'prop-types';
import moment from 'moment';

export default class Moment extends Component {
    static propTypes = {
        children: PropTypes.func,
        date: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.instanceOf(Date),
        ]),
        format: PropTypes.string,
        liveUpdate: PropTypes.bool.isRequired,
        liveUpdateInterval: PropTypes.number,
    };
        
  static defaultProps = {
    format: 'MMMM Do YYYY, h:mm a',
    liveUpdate: false,
  };
    interval?: NodeJS.Timeout | null = null;

  componentDidMount() {
    const { liveUpdate, liveUpdateInterval } = this.props as any;

    if (liveUpdate || liveUpdateInterval) {
      const interval = liveUpdateInterval || 10000;
      this.interval = setInterval(() => this.forceUpdate(), interval);
    }
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  render() {
    const { date, children, format, ...rest } = this.props as any;

    return (
      <div style={{fontSize: 12}} {...rest}>
        {children ?
            children(moment(date))
          :
            moment(date).format(format)
        }
      </div>
    );
  }
}