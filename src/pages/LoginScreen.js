import React from 'react'

import styles from './LoginScreen.css';
import DMMLogo from '../assets/images/dmm-logo.svg';

class LoginScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: null,
      showError: false,
    }
  }

  login() {
    fetch('http://api.defimoneymarket.com/v1/dmg-sale/verify-password', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': this.state.password
      },
      body: JSON.stringify({})
    }).then(response => response.text())
      .then(body => {
          console.log('BODY');
          console.log(body);
          const response = JSON.parse(body).data;
          if (response) {
            this.props.onLogin();
          }
          else {
            this.setState({ showError: true });
          }
        }
      )
  }

  render() {

    return (
      <div className={'loginScreen'}>
        <div className={'loginScreenInner'}>
          <div className={'loginScreenTitleWrapper'}>
            <div className={'loginScreenDmmLogo'}>
              <img src={DMMLogo}/>
            </div>
            <div className={'loginScreenTitleInner'}>
              <div className={'loginScreenTitle'}>
                DMG Token Sale
              </div>
              <div className={'loginScreenSubtitle'}>
                Private Round
              </div>
            </div>
          </div>
          <div className={'loginScreenDescription'}>
            <div className={'loginScreenLineOne'}>This presale of DMG (DMM Governance Tokens) is only open to select participants.</div>
            <div className={'loginScreenLineTwo'}>If you have been provided a password, please enter it below to proceed.</div>
          </div>
          <div className={'loginScreenPasswordWrapper'}>
            <div className={'loginScreenPasswordField'}>
              <input
                value={this.state.password}
                onChange={e => this.setState({ password: e.target.value })}
                type={'password'}
              />
            </div>
            <div className={'loginScreenPasswordSubmit'}>
              <button
                className={'loginScreenPasswordSubmitButton'}
                onClick={() => this.login()}
              >
                Enter
              </button>
            </div>
          </div>
          { this.state.showError &&
            <div className={'loginScreenError'}>
              Invalid password
            </div>
          }
        </div>
      </div>
    )
  }
}

export default LoginScreen;
