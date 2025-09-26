import whyDidYouRender from '@welldone-software/why-did-you-render'
import React from 'react'

if (process.env.NODE_ENV === 'development' && process.env.WDYR === 'true') {
  whyDidYouRender(React, {
    // use this to filter down to specific component names, ie /Select.*/
    include: [/.*/],
    collapseGroups: true,
    logOnDifferentValues: true,
    trackAllPureComponents: true,
    trackHooks: true,
  })
}
