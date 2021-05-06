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
  font-size: 9px;
  font-weight: 600;
  line-height: 11px;
  letter-spacing: 0em;
`

export const OrangeGasPriceOption = styled(BaseGasPriceOption)`
  color: #f2994a;
  background-color: ${() => transparentize(0.92, '#f2994a')};
  border: solid 1px ${props => (props.active ? '#f2994a' : 'tranparent')};
  transition: border 0.3s ease;
`

export const GreenGasPriceOption = styled(BaseGasPriceOption)`
  color: #0e9f6e;
  background-color: ${() => transparentize(0.92, '#0E9F6E')};
  border: solid 1px ${props => (props.active ? '#0e9f6e' : 'transparent')};
  transition: border 0.3s ease;
`

export const PurpleGasPriceOption = styled(BaseGasPriceOption)`
  color: #9981ff;
  background-color: ${() => transparentize(0.92, '#9981ff')};
  border: solid 1px ${props => (props.active ? '#9981ff' : 'transparent')};
  transition: border 0.3s ease;
`
