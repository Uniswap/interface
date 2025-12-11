import { deprecatedStyled } from 'lib/styled-components'
import { Body } from 'pages/App/Body'
import { Header } from 'pages/App/Header'
import { GRID_AREAS } from 'pages/App/utils/shared'
import { breakpoints } from 'ui/src/theme'

const AppContainer = deprecatedStyled.div`
  min-height: 100vh;
  max-width: 100vw;

  // grid container settings
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  grid-template-areas: '${GRID_AREAS.HEADER}' '${GRID_AREAS.MAIN}' '${GRID_AREAS.MOBILE_BOTTOM_BAR}';
`
const AppBody = deprecatedStyled.div`
  grid-area: ${GRID_AREAS.MAIN};
  width: 100vw;
  min-height: 100%;
  max-width: ${({ theme }) => `${theme.maxWidth}px`};
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  flex: 1;
  position: relative;
  margin: auto;

  @media screen and (max-width: ${breakpoints.md}px) {
    padding-left: 10px;
    padding-right: 10px;
  }
`

export function AppLayout() {
  return (
    <AppContainer>
      <Header />
      <AppBody>
        <Body />
      </AppBody>
    </AppContainer>
  )
}
