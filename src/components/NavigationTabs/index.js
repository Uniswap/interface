import React, { useCallback } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import { connect } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { dismissBetaMessage } from '../../ducks/app'
import { useBodyKeyDown } from '../../hooks'

import './navigation-tabs.scss'

const tabOrder = [
  {
    path: '/swap',
    textKey: 'swap',
    regex: /\/swap/
  },
  {
    path: '/send',
    textKey: 'send',
    regex: /\/send/
  },
  {
    path: 'add-liquidity',
    textKey: 'pool',
    regex: /\/add-liquidity|\/remove-liquidity|\/create-exchange.*/
  }
]

function NavigationTabs({ location: { pathname }, history, dismissBetaMessage, showBetaMessage }) {
  const { t } = useTranslation()

  const navigate = useCallback(
    direction => {
      const tabIndex = tabOrder.findIndex(({ regex }) => pathname.match(regex))
      history.push(tabOrder[(tabIndex + tabOrder.length + direction) % tabOrder.length].path)
    },
    [pathname, history]
  )
  const navigateRight = useCallback(() => {
    navigate(1)
  }, [navigate])
  const navigateLeft = useCallback(() => {
    navigate(-1)
  }, [navigate])

  useBodyKeyDown('ArrowRight', navigateRight)
  useBodyKeyDown('ArrowLeft', navigateLeft)

  return (
    <>
      <div className="tabs">
        {tabOrder.map(({ path, textKey, regex }) => (
          <NavLink
            key={path}
            to={path}
            className="tab"
            activeClassName="tab--selected"
            isActive={(_, { pathname }) => pathname.match(regex)}
          >
            {t(textKey)}
          </NavLink>
        ))}
      </div>
      {showBetaMessage && (
        <div className="beta-message" onClick={dismissBetaMessage}>
          <span role="img" aria-label="warning">
            💀
          </span>{' '}
          {t('betaWarning')}
        </div>
      )}
    </>
  )
}

export default withRouter(
  connect(
    state => ({
      showBetaMessage: state.app.showBetaMessage
    }),
    dispatch => ({
      dismissBetaMessage: () => dispatch(dismissBetaMessage())
    })
  )(NavigationTabs)
)
