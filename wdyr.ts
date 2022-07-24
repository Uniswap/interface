/// <reference types="@welldone-software/why-did-you-render" />
import React from 'react'

if (process.env.NODE_ENV === 'development') {
  // The library should NEVER be used in production because it slows down React
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  // Default to not tracking all components, add whyDidYouRender = true to component functions you want to track
  whyDidYouRender(React, {
    trackAllPureComponents: false,
    // trackHooks: true,
    // trackExtraHooks: [[ReactRedux, 'useSelector']],
  })
}
