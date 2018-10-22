import React, { Component } from 'react';
import { drizzleConnect } from 'drizzle-react';
import OversizedPanel from "../../components/OversizedPanel";
import Dropdown from "../../assets/images/dropdown.svg";
import Modal from "../../components/Modal";
import {CSSTransitionGroup} from "react-transition-group";

class ModeSelector extends Component {
  state = {
    isShowingModal: false,
  };

  renderModal() {
    if (!this.state.isShowingModal) {
      return;
    }

    return (
      <Modal onClose={() => this.setState({ isShowingModal: false })}>
        <CSSTransitionGroup
          transitionName="pool-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="pool-modal">
            <div
              className="pool-modal__item"
              onClick={() => this.setState({ isShowingModal: false })}
            >
              Add Liquidity
            </div>
            <div
              className="pool-modal__item"
              onClick={() => this.setState({ isShowingModal: false })}
            >
              Remove Liquidity
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    );
  }

  render() {
    return (
      <OversizedPanel hideTop>
        <div
          className="pool__liquidity-container"
          onClick={() => this.setState({ isShowingModal: true })}
        >
          <span className="pool__liquidity-label">Add Liquidity</span>
          <img src={Dropdown} />
        </div>
        {this.renderModal()}
      </OversizedPanel>
    )
  }
}

export default drizzleConnect(ModeSelector);
