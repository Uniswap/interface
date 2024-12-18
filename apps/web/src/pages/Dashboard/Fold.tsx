import { forwardRef } from 'react'
import { DirectToDefi } from './sections/DirectToDefi'
// import { Footer } from './sections/Footer'
// import { NewsletterEtc } from './sections/NewsletterEtc'
import { Stats } from './sections/Stats'

const Fold = forwardRef<HTMLDivElement>(function Fold() {
  return (
    <>
      <Stats />
      <div style={{ height: '50px' }}></div>
      <DirectToDefi />

      {/* <NewsletterEtc />
      <Footer /> */}
    </>
  )
})

export default Fold
