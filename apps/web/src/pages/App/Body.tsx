import Loader from 'components/Icons/LoadingSpinner'
import { RouteDefinition, routes, useRouterConfig } from 'pages/RouteDefinitions'
import { lazy, memo, Suspense } from 'react'
import { Route, Routes } from 'react-router'

// The Chrome is always loaded, but is lazy-loaded because it is not needed without user interaction.
// Annotating it with webpackPreload allows it to be ready when requested.
const AppChrome = lazy(() => import(/* webpackPreload: true */ './Chrome'))

export const Body = memo(function Body({ shouldRenderAppChrome = true }: { shouldRenderAppChrome?: boolean }) {
  const routerConfig = useRouterConfig()

  return (
    <>
      {shouldRenderAppChrome ? (
        <Suspense>
          <AppChrome />
        </Suspense>
      ) : null}

      <Suspense fallback={<Loader />}>
        <Routes>
          {routes.map((route: RouteDefinition) =>
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
    </>
  )
})
