import { AlertTriangle, XOctagon } from 'react-feather'
import styled, { css } from 'styled-components/macro'

const IconStyle = css`
  margin-left: 0.3rem;
  width: 14px;
  height: 14px;
`

const MediumIcon = styled(AlertTriangle)`
  ${IconStyle}
`
const StrongIcon = MediumIcon
const BlockedIcon = styled(XOctagon)`
  ${IconStyle}
`
export enum WarningTypes {
  MEDIUM,
  STRONG,
  BLOCKED,
}

//type WarningSet = { text: string; color: Color; bgColor: Color }

//Replace to use colors from theme sheet later
export const WARNING_TO_ATTRIBUTES = {
  [WarningTypes.MEDIUM]: {
    text: 'Caution',
    icon: <MediumIcon strokeWidth={2.5} />,
    color: '#F3B71E',
    heading: "This token isn't verified",
    description: 'Please do your own research before trading.',
  },
  [WarningTypes.STRONG]: {
    text: 'Warning',
    icon: <StrongIcon />,
    color: '#FA2B39',
    heading: "This token isn't verified",
    description: 'Please do your own research before trading.',
  },
  [WarningTypes.BLOCKED]: {
    text: 'Not Available',
    icon: <BlockedIcon />,
    color: '#99A1BD',
    heading: '',
    description: "You can't trade this token using the Uniswap App.",
  },
}
