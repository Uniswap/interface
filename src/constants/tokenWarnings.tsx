import { AlertTriangle, XOctagon } from 'react-feather'
import styled, { css } from 'styled-components/macro'
import { Color } from 'theme/styled'

import WarningCache, { TOKEN_LIST_TYPES } from '../constants/TokenWarningLookupCache'

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

export type Warning = {
  text: string
  icon: JSX.Element
  color: Color
  heading: string
  description: string
  canProceed: boolean
  buttonColor?: Color
  buttonTextColor?: Color
  cancelTextColor?: Color
}

const MediumWarning: Warning = {
  text: 'Caution',
  icon: <MediumIcon strokeWidth={2.5} />,
  color: '#F3B71E',
  heading: "This token isn't verified",
  description: 'Please do your own research before trading.',
  canProceed: true,
}

const StrongWarning: Warning = {
  text: 'Warning',
  icon: <StrongIcon />,
  color: '#FA2B39',
  heading: "This token isn't verified",
  description: 'Please do your own research before trading.',
  canProceed: true,
  buttonColor: '#FA2B391F',
  buttonTextColor: '#FA2B39',
  cancelTextColor: 'white',
}

const BlockedWarning: Warning = {
  text: 'Not Available',
  icon: <BlockedIcon />,
  color: '#99A1BD',
  heading: '',
  description: "You can't trade this token using the Uniswap App.",
  canProceed: false,
}

// Todo: Replace this with actual extended list
const UniswapExtendedList: string[] = []

export function checkWarning(tokenAddress: string) {
  switch (WarningCache.checkToken(tokenAddress.toLowerCase())) {
    case TOKEN_LIST_TYPES.UNI_DEFAULT:
      return null
    case TOKEN_LIST_TYPES.UNI_EXTENDED:
      return MediumWarning
    case TOKEN_LIST_TYPES.UNKNOWN:
      return StrongWarning
    case TOKEN_LIST_TYPES.BLOCKED:
      return BlockedWarning
  }
}
