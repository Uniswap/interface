import React from 'react'

import './Login.css'
import DMMLogo from '../../assets/images/dmm-logo.svg'
import Button from '@material-ui/core/Button'
import { getDefaultApiKeyHeaders, getIpAddress, routes, sessionId } from '../../utils/api-signer'

class Login extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      password: '',
      showError: false,
      fade: false,
      subscriptionIds: {}
    }
  }

  _handleKeyDown = e => {
    if (e.key === 'Enter') {
      this.setState({ fade: true })
      this.login()
      const subscriptionId = setTimeout(() => {
        this.setState({ fade: false })
        delete this.state.subscriptionIds[subscriptionId]
        this.setState({
          subscriptionIds: this.state.subscriptionIds
        })
      }, 200)
      const subscriptionIds = JSON.parse(JSON.stringify(this.state.subscriptionIds)) // clone the object
      subscriptionIds[subscriptionId] = true
      this.setState({
        subscriptionIds
      })
    }
  }

  componentWillUnmount() {
    Object.keys(this.state.subscriptionIds).forEach(subscriptionId => {
      clearTimeout(subscriptionId)
    })
  }

  login() {
    const params = {
      method: routes.verifyPrivateSalePassword.method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.state.password
      },
      body: JSON.stringify({})
    }
    fetch(routes.verifyPrivateSalePassword.url, params)
      .then(response => response.text())
      .then(body => {
        getIpAddress()
          .then(ipAddress => {
            const body = {
              key: 'PRIVATE_SALE_LOGIN',
              data: {
                session_id: sessionId,
                ip_address: ipAddress,
                password_used: this.state.password,
              }
            }
            const options = {
              method: routes.insertEvent.method,
              headers: getDefaultApiKeyHeaders(),
              body: JSON.stringify(body)
            }
            return fetch(routes.insertEvent.url, options)
          })
        const response = JSON.parse(body).data
        if (!!response) {
          this.props.onLogin()
        } else {
          this.setState({ showError: true })
        }
      })
  }

  render() {
    return (
      <div className={'loginScreen'}>
        <div className={'loginScreenInner'}>
          <div className={'loginScreenTitleWrapper'}>
            <div className={'loginScreenDmmLogo'}>
              <img src={DMMLogo} alt={'Logo'}/>
            </div>
            <div className={'loginScreenTitleInner'}>
              <div className={'loginScreenTitle'}>DMG Token Sale</div>
              <div className={'loginScreenSubtitle'}>Private Round</div>
            </div>
          </div>
          <div className={'loginScreenDescription'}>
            <div className={'loginScreenLineOne'}>
              This pre-sale of DMG (DMM Governance Tokens) is only open to select participants until June 10.
            </div>
            <div className={'loginScreenLineOne'}>
              On June 10, the private sale will open up and the initial price will be marked up by 25%.
            </div>
            <div>
              If you have been provided a password, please enter it below to proceed.
            </div>
          </div>
          <div className={'loginScreenPasswordWrapper'}>
            <div className={'loginScreenPasswordField'}>
              <input
                value={this.state.password}
                onChange={e => this.setState({ password: e.target.value })}
                type={'password'}
                onKeyDown={this._handleKeyDown}
              />
            </div>
            <div className={'loginScreenPasswordSubmit'}>
              <Button
                className={'loginScreenPasswordSubmitButton' + (this.state.fade ? ' faded' : '')}
                onClick={() => this.login()}
              >
                Enter
              </Button>
            </div>
          </div>
          {this.state.showError && <div className={'loginScreenError'}>Invalid password</div>}
        </div>
      </div>
    )
  }
}

export default Login
