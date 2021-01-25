import React from 'react'
import styled from 'styled-components'

const Container = styled.label<{ disabled?: boolean }>`
  display: flex;
  height: 16px;
  align-items: center;
  position: relative;
  padding-left: 26px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.4 : 1)};
`

const OuterCheckmark = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  height: 16px;
  width: 16px;
  box-sizing: border-box;
  background-color: transparent;
  border-radius: 50%;
  border: solid 2px ${props => props.theme.white};
`

const Label = styled.span`
  font-weight: 600;
  font-size: 11px;
  line-height: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.white};
`

const Checkmark = styled.span<{ checked?: boolean }>`
  position: absolute;
  top: 2px;
  left: 2px;
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
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Radio({ checked, label, value, disabled, onChange }: RadioProps) {
  return (
    <Container disabled={disabled}>
      <input type="radio" value={value} onChange={onChange} hidden disabled={disabled} />
      <Label>{label}</Label>
      <OuterCheckmark>
        <Checkmark checked={checked} />
      </OuterCheckmark>
    </Container>
  )
}
