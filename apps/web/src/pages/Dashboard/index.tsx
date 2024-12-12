import { InterfacePageName } from '@ubeswap/analytics-events'
import { Trace } from 'analytics'

import Fold from './Fold'

export default function Landing() {
  return (
    <Trace page={InterfacePageName.LANDING_PAGE} shouldLogImpression>
      <Fold />
    </Trace>
  )
}
