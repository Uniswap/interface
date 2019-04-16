import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { withTranslation } from 'react-i18next'
import OversizedPanel from '../../components/OversizedPanel'
import Dropdown from '../../assets/images/dropdown-blue.svg'
import Modal from '../../components/Modal'
import { CSSTransitionGroup } from 'react-transition-group'

const ADD = 'Add Liquidity'
const REMOVE = 'Remove Liquidity'
const CREATE = 'Create Exchange'

class ModeSelector extends Component {
  state = {
    isShowingModal: false,
    selected: ADD
  }

  changeView(view) {
    const { history } = this.props

    this.setState({
      isShowingModal: false,
      selected: view
    })

    switch (view) {
      case ADD:
        return history.push('/add-liquidity')
      case REMOVE:
        return history.push('/remove-liquidity')
      case CREATE:
        return history.push('/create-exchange')
      default:
        return
    }
  }

  renderModal() {
    if (!this.state.isShowingModal) {
      return
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
            <div className="pool-modal__item" onClick={() => this.changeView(ADD)}>
              {this.props.t('addLiquidity')}
            </div>
            <div className="pool-modal__item" onClick={() => this.changeView(REMOVE)}>
              {this.props.t('removeLiquidity')}
            </div>
            <div className="pool-modal__item" onClick={() => this.changeView(CREATE)}>
              {this.props.t('createExchange')}
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    )
  }

  render() {
    return (
      <OversizedPanel hideTop>
        <div className="pool__liquidity-container" onClick={() => this.setState({ isShowingModal: true })}>
          <span className="pool__liquidity-label">{this.props.title}</span>
          <img src={Dropdown} alt="dropdown" />
        </div>
        {this.renderModal()}
      </OversizedPanel>
    )
  }
}

export default withRouter(withTranslation()(ModeSelector))
