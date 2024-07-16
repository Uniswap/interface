import { PageTabs } from 'components/NavBar/LEGACY'
import { MobileBottomBarLegacy } from 'components/NavBar/MobileBottomBar'
import styled from 'lib/styled-components'
import { Body } from 'pages/App/Body'
import { Header } from 'pages/App/Header'
import { GRID_AREAS } from 'pages/App/utils/shared'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const AppContainer = styled.div`
  min-height: 100vh;

  // grid container settings
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  grid-template-areas: '${GRID_AREAS.HEADER}' '${GRID_AREAS.MAIN}' '${GRID_AREAS.MOBILE_BOTTOM_BAR}';
`
const AppBody = styled.div`
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

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    padding-left: 10px;
    padding-right: 10px;
  }
`
const MobileBar = styled.div`
  grid-area: mobile-bar;
  width: 100vw;
  position: fixed;
  bottom: 0px;
  z-index: ${Z_INDEX.sticky};
`

export function AppLayout() {
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh)

  return (
    <AppContainer>
      <Header />
      <AppBody>
        <Body />
      </AppBody>
      <MobileBar>
        {isLegacyNav && (
          <MobileBottomBarLegacy>
            <PageTabs />
          </MobileBottomBarLegacy>
        )}
      </MobileBar>
    </AppContainer>
  )
}
