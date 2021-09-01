import { AutoRow } from 'components/Row'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { ReactComponent as AutoRouterIcon } from '../../assets/svg/auto_router.svg'

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 16px;
  width: 16px;
  stroke: #2172e5;
`

const GradientText = styled(TYPE.black)`
  line-height: 1rem;

  /* fallback color */
  color: ${({ theme }) => theme.green1};

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

export function RouterLabel() {
  return (
    <AutoRow gap="4px" width="auto">
      <StyledAutoRouterIcon />
      <GradientText fontSize={14}>Auto Router</GradientText>
    </AutoRow>
  )
}
