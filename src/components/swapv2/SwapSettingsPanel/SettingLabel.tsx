import { isMobile } from 'react-device-detect'
import styled from 'styled-components'

const SettingLabel = styled.span`
  font-size: ${isMobile ? '14px' : '12px'};
  color: ${({ theme }) => theme.text};
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
`

export default SettingLabel
