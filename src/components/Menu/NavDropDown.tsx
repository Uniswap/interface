import { Trans } from '@lingui/macro'
import React, { ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'

import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import { ExternalNavMenuItem, NavMenuItem } from '.'

const LinkContainer = styled.div`
  padding-left: 20px;
`

export default function NavDropDown({
  title,
  link,
  icon,
  options,
}: {
  title: string
  icon: ReactNode
  link: string
  options: { link: string; label: string; external?: boolean }[]
}) {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <div>
      <NavMenuItem to={link} onClick={handleClick}>
        {icon}
        <Trans>{title}</Trans>
        <ChevronDown size={16} style={{ marginLeft: '6px' }} />
      </NavMenuItem>
      {isShowOptions && (
        <LinkContainer>
          {options.map(item =>
            item.external ? (
              <ExternalNavMenuItem key={item.link} href={item.link} onClick={toggle}>
                <Trans>{item.label}</Trans>
              </ExternalNavMenuItem>
            ) : (
              <NavMenuItem to={item.link} key={item.link} onClick={toggle}>
                <Trans>{item.label}</Trans>
              </NavMenuItem>
            ),
          )}
        </LinkContainer>
      )}
    </div>
  )
}
