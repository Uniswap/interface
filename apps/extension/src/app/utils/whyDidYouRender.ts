import { isDevEnv } from '@universe/environment'
import whyDidYouRender from '@welldone-software/why-did-you-render'
import React from 'react'
import { getConfig } from 'src/app/config'

if (isDevEnv() && getConfig().wdyr) {
  whyDidYouRender(React, {
    // use this to filter down to specific component names, ie /Select.*/
    include: [/.*/],
    collapseGroups: true,
    logOnDifferentValues: true,
    trackAllPureComponents: true,
    trackHooks: true,
  })
}
