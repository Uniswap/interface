import { Trans } from '@lingui/macro'
import { ReactNode, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { ExternalLink } from 'theme'

const Wrapper = styled.div`
  transition: all 0.2s ease;
  overflow: hidden;
  flex: 1;
`
const LinkContainer = styled.div<{ $isShow?: boolean; $height: number }>`
  padding-left: 24px;
  transition: all 0.3s ease;
  ${({ $isShow, $height }) => ($isShow ? `height: ${$height}px;` : 'height: 0px;')}
  > * {
    padding: 12px 0;
  }

  > *:first-child {
    padding-top: 24px;
  }
  > *:last-child {
    padding-bottom: 0;
  }
`
const DropdownIcon = styled(DropdownSVG)<{ $isShow?: boolean }>`
  transition: all 0.2s ease;
  height: 24px !important;
  width: 24px !important;
  ${({ $isShow }) => $isShow && 'transform: rotate(180deg);'}
`

const TitleWrapper = styled(NavLink)`
  display: flex;
  justify-content: space-between;
`

export default function NavDropDown({
  title,
  link,
  icon,
  options,
}: {
  title: ReactNode
  icon: ReactNode
  link: string
  options: { link: string; label: ReactNode; external?: boolean }[]
}) {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const toggle = useToggleModal(ApplicationModal.MENU)
  const ref = useRef<HTMLDivElement>(null)

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <Wrapper>
      <TitleWrapper to={link} onClick={handleClick}>
        {icon}
        <Text flex={1}>
          <Trans>{title}</Trans>
        </Text>
        <DropdownIcon $isShow={isShowOptions} />
      </TitleWrapper>
      <LinkContainer $isShow={isShowOptions} ref={ref} $height={ref.current?.scrollHeight || 0}>
        {options.map(item =>
          item.external ? (
            <ExternalLink key={item.link} href={item.link} onClick={toggle}>
              {item.label}
            </ExternalLink>
          ) : (
            <NavLink to={item.link} key={item.link} onClick={toggle}>
              {item.label}
            </NavLink>
          ),
        )}
      </LinkContainer>
    </Wrapper>
  )
}
