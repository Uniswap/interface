import { useRef } from 'react'
import { ChevronDown as Arrow } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css, useTheme } from 'styled-components'

import { AutoColumn } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { TYPE } from 'theme'

const StyledIcon = styled(Flex)`
  color: ${({ theme }) => theme.subText};
`

const Wrapper = styled.div`
  z-index: 20;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  width: 110px;
  padding: 7px 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;

  :hover {
    cursor: pointer;
  }
`

const Dropdown = styled.div`
  position: absolute;
  top: 52px;
  padding-top: 40px;
  width: calc(100% - 40px);
  background-color: ${({ theme }) => theme.tableHeader};
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 16px 12px;
  border-radius: 16px;
  width: calc(100% - 20px);
  :hover {
    cursor: pointer;
  }
`

const ArrowStyled = styled(Arrow)<{ open: boolean }>`
  height: 20px;
  width: 20px;
  ${({ open }) =>
    open &&
    css`
      transform: scale(-1, -1);
    `}
`

type DropdownSelectPropsType = {
  options?: any
  active?: any
  setActive?: any
  color?: any
  optionTitles?: any
  name?: ApplicationModal
}

const DropdownSelect = ({
  options,
  active,
  setActive,
  color,
  optionTitles,
  name = ApplicationModal.TIME_DROPDOWN,
}: DropdownSelectPropsType): JSX.Element => {
  const node = useRef(null)
  const theme = useTheme()
  const open = useModalOpen(name)
  const toggle = useToggleModal(name)

  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <Wrapper color={color}>
      <RowBetween onClick={toggle} justify="center">
        <TYPE.main>{optionTitles && optionTitles[active] ? optionTitles[active] : active}</TYPE.main>
        <StyledIcon alignItems="center">
          <ArrowStyled open={open} />
        </StyledIcon>
      </RowBetween>
      {open && (
        <Dropdown ref={node}>
          <AutoColumn gap="16px">
            {Object.keys(options).map((key, index) => {
              const option = options[key]
              return (
                option !== active && (
                  <Row
                    onClick={() => {
                      toggle()
                      setActive(option)
                    }}
                    key={index}
                  >
                    <Text fontSize={12} fontWeight={500} color={theme.subText}>
                      {optionTitles && optionTitles[key] ? optionTitles[key] : option}
                    </Text>
                  </Row>
                )
              )
            })}
          </AutoColumn>
        </Dropdown>
      )}
    </Wrapper>
  )
}

export default DropdownSelect
