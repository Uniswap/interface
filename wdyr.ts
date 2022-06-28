/// <reference types="@welldone-software/why-did-you-render" />
import whyDidYouRender from '@welldone-software/why-did-you-render'
import React from 'react'

if (process.env.NODE_ENV === 'development') {
  // Default to not tracking all components, add whyDidYouRender = true to component functions you want to track
  whyDidYouRender(React, {
    trackAllPureComponents: false,
  })
}
