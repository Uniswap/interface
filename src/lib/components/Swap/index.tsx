import { useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Settings from './Settings'

export default function Swap() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <Header logo title="Swap">
        <Settings />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}></BoundaryProvider>
      </div>
    </>
  )
}
