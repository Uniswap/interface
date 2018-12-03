import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './copy.scss';
import Tooltip from '../Tooltip';

export default class Copy extends Component {
  constructor(props) {
    super(props);

    this.state = {
      copied: false,
    };

    this.onCopy = this.onCopy.bind(this);
  }

  onCopy = () => {
    this.setState({
      copied: true
    });
    setTimeout(() => {
      this.setState({copied: false});
    }, 3000);

    this.textElement.select();
    document.execCommand('copy');
  }

  renderTooltip() {
    if (!this.state.copied) {
      return;
    }

    return (
      <div className="copy__tooltip">Copied</div>
    );
  }

  render() {
    const { value } = this.props;

    return (
      <div className="copy__container" onClick={this.onCopy}>
        <Tooltip
          content="Copied!"
          disabled={!this.state.copied}
          tooltipStyle={{
            width: '40px',
            top: '-40px',
            left: '-10px',
          }}
        >
          <textarea
            key="text"
            ref={element => this.textElement = element}
            className="copy__outside"
            value={value || ''}
            readOnly
          />
          {this.props.children}
        </Tooltip>
      </div>
    );
  }
}

Copy.defaultProps = {
  value: '',
  onCopy: () => {}
};

Copy.propTypes = {
  value: PropTypes.string,
};
