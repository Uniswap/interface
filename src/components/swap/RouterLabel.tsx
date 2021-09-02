import { AutoRow } from 'components/Row'
import styled, { keyframes } from 'styled-components/macro'
import { TYPE } from 'theme'
import { ReactComponent as AutoRouterIcon } from '../../assets/svg/auto_router.svg'

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 16px;
  width: 16px;
  stroke: #2172e5;
`

const pulse = keyframes`
  0% {background-position:10% 100%}
  50%{background-position:91% 100%}
  100%{background-position:10% 100%}
`

const GradientText = styled(TYPE.black)<{ pulsing: boolean }>`
  line-height: 1rem;

  /* fallback color */
  color: ${({ theme }) => theme.green1};

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    /* background-image: ${({ theme, pulsing }) =>
      `linear-gradient(90deg, #2172e5, ${
        pulsing ? ` ${theme.blue1}, ${theme.blue1}, ${theme.bg0}, ${theme.green1} , ${theme.green1},` : ''
      } ${theme.green1}, ${theme.green1})`}; */
    /* background-size: ${({ pulsing }) => (pulsing ? '200% 100%' : '100% 100%')}; */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    /* animation: ${({ pulsing }) => pulsing && pulse} 0.8s infinite ease-in-out; */
    /* will-change: background-position; */
  }
`

export function RouterLabel({ syncing = false }: { syncing?: boolean }) {
  return (
    <AutoRow gap="4px" width="auto">
      <StyledAutoRouterIcon />
      <GradientText fontSize={14} pulsing={syncing}>
        Auto Router
      </GradientText>
    </AutoRow>
  )
}
