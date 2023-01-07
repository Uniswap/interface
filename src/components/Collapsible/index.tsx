import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import React, { ReactNode, useState } from 'react'
import { ArrowDownCircle, ArrowLeft } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { BaseButton } from '../Button'
import { AutoColumn } from '../Column'

const CollapsibleContainer = styled(AutoColumn)<{ isOpen: boolean }>`
  background-color: transparent;
  border-radius: 20px;
`

const CollapsibleToggler = styled(BaseButton)<{ isOpen: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text1};
  cursor: pointer;
  box-shadow: ${({ theme, isOpen }) => (!isOpen ? '0 0 12px 6px ' + theme.shadow2 : 'none')};
  border: ${({ theme, isOpen }) => (isOpen ? '3px solid' + theme.shadow3 : 'none')};
  border-bottom: ${({ theme, isOpen }) => (isOpen ? '3px solid' + theme.shadow3 : 'none')};
  border-radius: 20px;
  border-bottom-left-radius: ${({ isOpen }) => (isOpen ? '0px' : '20px')};
  border-bottom-right-radius: ${({ isOpen }) => (isOpen ? '0px' : '20px')};
  padding: 1rem;
  width: 100%;
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.primary1)};
    color: ${({ theme }) => theme.white};
  }
`

const CollapsibleContentContainer = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  background: transparent;
  position: relative;
  top: -10px;
  border-left: 3px solid ${({ theme }) => theme.shadow3};
  border-bottom: 3px solid ${({ theme }) => theme.shadow3};
  border-right: 3px solid ${({ theme }) => theme.shadow3};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  overflow: auto;
  width: 100%;
  height: 305px;
  max-height: 100%;
  padding: 0.5rem;
  margin-top: 10px;

  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.primary1};
    border-radius: 20px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => darken(0.05, theme.primary1)};
  }
`

const StyledArrow = styled(ArrowDownCircle)<{ isOpen: boolean }>`
  transform: ${({ isOpen }) => (isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: all 0.25s ease-in;
`

interface CollapsibleProps {
  label: string
  initState?: boolean
  children?: ReactNode
}

export default function Collapsible({ label, children, initState = false }: CollapsibleProps) {
  const [isOpen, setOpen] = useState(initState)

  return (
    <CollapsibleContainer isOpen={isOpen}>
      <CollapsibleToggler type="button" onClick={() => setOpen(!isOpen)} isOpen={isOpen}>
        <Text fontSize={16} fontWeight={400}>
          <Trans>{label}</Trans>
        </Text>
        <StyledArrow isOpen={isOpen}>
          <ArrowLeft />
        </StyledArrow>
      </CollapsibleToggler>
      <CollapsibleContentContainer isOpen={isOpen}>{children}</CollapsibleContentContainer>
    </CollapsibleContainer>
  )
}
