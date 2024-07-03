import Loader from 'components/Icons/LoadingSpinner'
import { RouteDefinition, routes, useRouterConfig } from 'pages/RouteDefinitions'
import { Suspense, lazy, memo } from 'react'
import { Route, Routes } from 'react-router-dom'

// The Chrome is always loaded, but is lazy-loaded because it is not needed without user interaction.
// Annotating it with webpackPreload allows it to be ready when requested.
const AppChrome = lazy(() => import(/* webpackPreload: true */ './Chrome'))

export const Body = memo(function Body() {
  const routerConfig = useRouterConfig()

  return (
    <>
      <Suspense>
        <AppChrome />
      </Suspense>
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
