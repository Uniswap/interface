import React, { useState, useCallback } from 'react'
import { withRouter, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import OversizedPanel from '../../components/OversizedPanel'
import Dropdown from '../../assets/images/dropdown-blue.svg'
import Modal from '../../components/Modal'
import { useBodyKeyDown } from '../../hooks'

const poolTabOrder = [
  {
    path: '/add-liquidity',
    textKey: 'addLiquidity',
    regex: /\/add-liquidity/
  },
  {
    path: '/remove-liquidity',
    textKey: 'removeLiquidity',
    regex: /\/remove-liquidity/
  },
  {
    path: '/create-exchange',
    textKey: 'createExchange',
    regex: /\/create-exchange.*/
  }
]

const LiquidityContainer = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  font-size: 0.75rem;
  padding: 0.625rem 1rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.royalBlue};
  font-weight: 500;
  cursor: pointer;

  img {
    height: 0.75rem;
    width: 0.75rem;
  }
`

const LiquidityLabel = styled.span`
  flex: 1 0 auto;
`

const activeClassName = 'MODE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  padding: 1rem;
  margin-left: 1rem;
  margin-right: 1rem;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.doveGray};
  font-size: 1rem;

  &.${activeClassName} {
    background-color: ${({ theme }) => theme.white};
    border-radius: 3rem;
    box-shadow: 0 0 1px 1px ${({ theme }) => theme.mercuryGray};
    font-weight: 500;
    color: ${({ theme }) => theme.royalBlue};
  }
`

const PoolModal = styled.div`
  background-color: ${({ theme }) => theme.white};
  width: 100%;
  height: 100%;
  padding: 2rem 0 2rem 0;
`

function ModeSelector({ location: { pathname }, history }) {
  const { t } = useTranslation()

  const [modalIsOpen, setModalIsOpen] = useState(false)

  const activeTabKey = poolTabOrder[poolTabOrder.findIndex(({ regex }) => pathname.match(regex))].textKey

  const navigate = useCallback(
    direction => {
      const tabIndex = poolTabOrder.findIndex(({ regex }) => pathname.match(regex))
      history.push(poolTabOrder[(tabIndex + poolTabOrder.length + direction) % poolTabOrder.length].path)
    },
    [pathname, history]
  )
  const navigateRight = useCallback(() => {
    navigate(1)
  }, [navigate])
  const navigateLeft = useCallback(() => {
    navigate(-1)
  }, [navigate])

  useBodyKeyDown('ArrowDown', navigateRight, modalIsOpen)
  useBodyKeyDown('ArrowUp', navigateLeft, modalIsOpen)

  return (
    <OversizedPanel hideTop>
      <LiquidityContainer
        onClick={() => {
          setModalIsOpen(true)
        }}
      >
        <LiquidityLabel>{t(activeTabKey)}</LiquidityLabel>
        <img src={Dropdown} alt="dropdown" />
      </LiquidityContainer>
      <Modal
        isOpen={modalIsOpen}
        onDismiss={() => {
          setModalIsOpen(false)
        }}
      >
        <PoolModal>
          {poolTabOrder.map(({ path, textKey, regex }) => (
            <StyledNavLink
              key={path}
              to={path}
              isActive={(_, { pathname }) => pathname.match(regex)}
              onClick={() => {
                setModalIsOpen(false)
              }}
            >
              {t(textKey)}
            </StyledNavLink>
          ))}
        </PoolModal>
      </Modal>
    </OversizedPanel>
  )
}

export default withRouter(ModeSelector)
