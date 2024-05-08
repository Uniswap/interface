import { ApprovedCheckmarkIcon } from 'nft/components/icons'
import React from 'react'
import styled from 'styled-components'
import { ClickableStyle } from 'theme/components'

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  line-height: 1;
`
const CheckContainer = styled.span<{ checked?: boolean; hovered?: boolean; size?: number }>`
  border-color: ${({ checked, hovered, theme }) => (checked || hovered ? theme.accent1 : theme.surface3)};
  background: ${({ checked, theme }) => (checked ? theme.accent1 : undefined)};
  display: inline-block;
  margin-right: 1px;
  border-radius: 4px;
  height: ${({ size }) => (size ? `${size}px` : '24px')};
  width: ${({ size }) => (size ? `${size}px` : '24px')};
  border-style: solid;
  border-width: 1.5px;
  position: relative;
  ${ClickableStyle}
`
const Input = styled.input`
  position: absolute;
  top: -24px;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`
const StyledCheck = styled(ApprovedCheckmarkIcon)<{ checked?: boolean; size?: number }>`
  display: ${({ checked }) => (checked ? 'inline-block' : 'none')};
  height: ${({ size }) => (size ? `${size}px` : '24px')};
  width: ${({ size }) => (size ? `${size}px` : '24px')};
  color: white;
  position: absolute;
  right: 1px;
`

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hovered: boolean
  children?: React.ReactNode
  className?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({ hovered, children, className, ...props }: CheckboxProps) => {
  return (
    <CheckboxLabel className={className}>
      {children}
      <CheckContainer
        checked={props.checked}
        hovered={hovered}
        size={props.size}
        // This element is purely decorative so
        // we hide it for screen readers
        aria-hidden="true"
      />
      <Input {...props} type="checkbox" />
      <StyledCheck checked={props.checked} size={props.size} />
    </CheckboxLabel>
  )
}
