import React, { useState } from 'react'

import { NavMenuItem } from '.'
import { Trans } from '@lingui/macro'

import { Info, ChevronDown } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import styled from 'styled-components'

const LinkContainer = styled.div`
  padding-left: 20px;
`

export default function AboutPageDropwdown() {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <div>
      <NavMenuItem to="/about" onClick={handleClick}>
        <Info size={14} />
        <Trans>About</Trans>
        <ChevronDown size={16} style={{ marginLeft: '6px' }} />
      </NavMenuItem>
      {isShowOptions && (
        <LinkContainer>
          <NavMenuItem to="/about/kyberswap" onClick={toggle}>
            <Trans>Kyberswap</Trans>
          </NavMenuItem>
          <NavMenuItem to="/about/knc" onClick={toggle}>
            <Trans>KNC</Trans>
          </NavMenuItem>
        </LinkContainer>
      )}
    </div>
  )
}
