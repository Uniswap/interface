import { transparentize } from 'polished'
import styled from 'styled-components'
import { Option } from '../Option'

const BaseGasPriceOption = styled(Option)<{ active?: boolean; compact?: boolean }>`
  padding: 0 4px;
  position: relative;
  min-width: 51px;
  height: ${props => (props.compact ? 17 : 28)}px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 9px;
  font-weight: 600;
  line-height: 11px;
  letter-spacing: 0em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const OrangeGasPriceOption = styled(BaseGasPriceOption)`
  color: ${props => (props.active ? '#f2994a' : props.theme.bg4)};
  background-color: ${props => (props.active ? transparentize(0.92, '#f2994a') : transparentize(0.8, props.theme.bg4))};
  border: solid 1px ${props => (props.active ? '#f2994a' : 'tranparent')};
  transition: border 0.3s ease;
`

export const GreenGasPriceOption = styled(BaseGasPriceOption)`
  color: ${props => (props.active ? '#0e9f6e' : props.theme.bg4)};
  background-color: ${props => (props.active ? transparentize(0.92, '#0E9F6E') : transparentize(0.8, props.theme.bg4))};
  border: solid 1px ${props => (props.active ? '#0e9f6e' : 'transparent')};
  transition: border 0.3s ease;
`

export const PurpleGasPriceOption = styled(BaseGasPriceOption)`
  color: ${props => (props.active ? '#9981ff' : props.theme.bg4)};
  background-color: ${props => (props.active ? transparentize(0.92, '#9981ff') : transparentize(0.8, props.theme.bg4))};
  border: solid 1px ${props => (props.active ? '#9981ff' : 'transparent')};
  transition: border 0.3s ease;
`
