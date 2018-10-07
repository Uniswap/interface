import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { CSSTransitionGroup } from 'react-transition-group';
import './modal.scss';

const modalRoot = document.querySelector('#modal-root');

export default class Modal extends Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    // this.el = document.createElement('div');
  }

  componentDidMount() {
    // The portal element is inserted in the DOM tree after
    // the Modal's children are mounted, meaning that children
    // will be mounted on a detached DOM node. If a child
    // component requires to be attached to the DOM tree
    // immediately when mounted, for example to measure a
    // DOM node, or uses 'autoFocus' in a descendant, add
    // state to Modal and only render the children when Modal
    // is inserted in the DOM tree.
    // modalRoot.style.display = 'block';
    // modalRoot.appendChild(this.el);
  }

  componentWillUnmount() {
    setTimeout(() => {
      // modalRoot.style.display = 'none';
      // modalRoot.removeChild(this.el);
    }, 500);
  }

  render() {
    return ReactDOM.createPortal(
      <div>
        <CSSTransitionGroup
          transitionName="modal-container"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="modal-container" onClick={this.props.onClose} key="modal" />
        </CSSTransitionGroup>
        {this.props.children}
      </div>,
      modalRoot,
    );
  }
}
