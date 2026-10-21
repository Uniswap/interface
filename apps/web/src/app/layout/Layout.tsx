import { styled } from '@universe/mycelium/styled'
import { Body } from '~/app/layout/Body'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/app/layout/constants'
import { GRID_AREAS } from '~/app/layout/gridAreas'
import { Header } from '~/app/layout/Header'
import type { EmbedView } from '~/pages/Swap/embedContext'
import { MAX_CONTENT_WIDTH_PX } from '~/theme'
import { MWEB_BOTTOM_INSET } from '~/utils/mwebBottomInset'

const AppContainer = styled('div', {
  platform: 'web',
  base: 'min-h-[100vh] max-w-[100vw] grid grid-cols-[1fr] grid-rows-[auto_auto_1fr]',
  inlineStyle: () => ({
    gridTemplateAreas: `'${GRID_AREAS.HEADER}' '${GRID_AREAS.MAIN}' '${GRID_AREAS.MOBILE_BOTTOM_BAR}'`,
  }),
})

const AppBody = styled('div', {
  platform: 'web',
  base: 'w-[100vw] min-h-[100%] flex flex-col relative items-center flex-1 m-auto media-md:px-[var(--app-body-gutter)]',
  inlineStyle: () => ({
    gridArea: GRID_AREAS.MAIN,
    maxWidth: `${MAX_CONTENT_WIDTH_PX}px`,
    // Every page tail scrolls clear of the in-app-browser chrome / safe-area band; 0 on desktop.
    paddingBottom: MWEB_BOTTOM_INSET,
    '--app-body-gutter': `${APP_BODY_MOBILE_GUTTER_PX}px`,
  }),
})

export function AppLayout({
  embedded = false,
  embedView = 'full',
}: { embedded?: boolean; embedView?: EmbedView } = {}) {
  return (
    <AppContainer>
      <Header />
      <AppBody>
        <Body embedded={embedded} embedView={embedView} />
      </AppBody>
    </AppContainer>
  )
}
