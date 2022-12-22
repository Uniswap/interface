import { Trans } from '@lingui/macro'
import React, { ReactNode, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import { ExternalNavMenuItem, NavMenuItem } from '.'

const Wrapper = styled.div`
  transition: all 0.2s ease;
  overflow: hidden;
`
const LinkContainer = styled.div<{ isShow?: boolean }>`
  padding-left: 24px;
  ${({ isShow }) => (isShow ? 'max-height: 500px;' : 'max-height: 0px;')}
`
const DropdownIcon = styled(DropdownSVG)<{ isShow?: boolean }>`
  transition: all 0.2s ease;
  ${({ isShow }) => isShow && 'transform: rotate(180deg);'}
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
    <Wrapper>
      <NavMenuItem to={link} onClick={handleClick}>
        {icon}
        <Text flex={1}>
          <Trans>{title}</Trans>
        </Text>
        <DropdownIcon isShow={isShowOptions} />
      </NavMenuItem>
      <LinkContainer isShow={isShowOptions}>
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
    </Wrapper>
  )
}
