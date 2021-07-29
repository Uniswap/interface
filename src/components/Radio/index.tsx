import React, { ReactNode } from 'react'
import styled from 'styled-components'

const Container = styled.label<{ disabled?: boolean }>`
  display: flex;
  height: 16px;
  align-items: center;
  position: relative;
  padding-left: 20px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.4 : 1)};
`

const OuterCheckmark = styled.span`
  position: absolute;
  top: 1px;
  left: 1px;
  height: 14px;
  width: 14px;
  box-sizing: border-box;
  background-color: transparent;
  border-radius: 50%;
  border: solid 1.5px ${props => props.theme.white};
`

const Label = styled.span`
  font-weight: 600;
  font-size: 11px;
  line-height: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.white};
`

const Icon = styled.div`
  width: 20px;
  height: 20px;
  margin-right: 4px;
`

const Checkmark = styled.span<{ checked?: boolean }>`
  position: absolute;
  top: 1.5px;
  left: 1.5px;
  height: 8px;
  width: 8px;
  background-color: ${props => (props.checked ? props.theme.white : 'transparent')};
  border-radius: 50%;
  transition: opacity.3s ease;
  opacity: ${props => (props.checked ? 1 : 0)};
`

interface RadioProps {
  checked?: boolean
  label: string
  disabled?: boolean
  value: string
  icon?: ReactNode
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Radio({ checked, label, icon, value, disabled, onChange }: RadioProps) {
  return (
    <Container disabled={disabled}>
      <input type="radio" value={value} checked={checked} onChange={onChange} hidden disabled={disabled} />
      {icon && <Icon>{icon}</Icon>}
      <Label>{label}</Label>
      <OuterCheckmark>
        <Checkmark checked={checked} />
      </OuterCheckmark>
    </Container>
  )
}
