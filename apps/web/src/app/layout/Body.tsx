import { lazy, memo, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { SpinningLoader } from 'ui/src'
import { EMBED_ENTRY_ROUTES, RouteDefinition, routes, useRouterConfig } from '~/pages/RouteDefinitions'
import { EmbedProvider, type EmbedView } from '~/pages/Swap/embedContext'

// The Chrome is always loaded, but is lazy-loaded because it is not needed without user interaction.
// Annotating it with webpackPreload allows it to be ready when requested.
const AppChrome = lazy(() => import(/* webpackPreload: true */ './Chrome'))

export const Body = memo(function Body({
  shouldRenderAppChrome = true,
  embedded = false,
  embedView = 'full',
}: {
  shouldRenderAppChrome?: boolean
  embedded?: boolean
  embedView?: EmbedView
}) {
  const routerConfig = useRouterConfig()
  // Embed documents mount the /embed entry routes on top of the full route tree; `embedView`
  // selects the surface (see SwapPage). Non-embed renders are unchanged.
  const routeDefinitions = embedded ? [...routes, ...EMBED_ENTRY_ROUTES] : routes

  return (
    <EmbedProvider view={embedView}>
      {shouldRenderAppChrome ? (
        <Suspense>
          <AppChrome />
        </Suspense>
      ) : null}

      <Suspense fallback={<SpinningLoader color="$accent1" />}>
        <Routes>
          {routeDefinitions.map((route: RouteDefinition) =>
            route.enabled(routerConfig) ? (
              <Route key={route.path} path={route.path} element={route.getElement(routerConfig)}>
                {route.nestedPaths.map((nestedPath) => (
                  <Route
                    path={nestedPath}
                    element={route.getElement(routerConfig)}
                    key={`${route.path}/${nestedPath}`}
                  />
                ))}
              </Route>
            ) : null,
          )}
        </Routes>
      </Suspense>
    </EmbedProvider>
  )
})
