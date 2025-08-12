import { AppsOverview } from 'pages/Landing/sections/AppsOverview'
import { Footer } from 'pages/Landing/sections/Footer'
import { NewsletterEtc } from 'pages/Landing/sections/NewsletterEtc'
import { Stats } from 'pages/Landing/sections/Stats'
import { forwardRef } from 'react'
import { Flex } from 'ui/src'

const Fold = forwardRef<HTMLDivElement>(function Fold(_props, scrollAnchor) {
  return (
    <Flex
      gap={120}
      $sm={{ gap: 80 }}
      position="relative"
      alignItems="center"
      width="100%"
      zIndex={1}
      maxWidth="100vw"
      ref={scrollAnchor}
    >
      <Stats />
      <AppsOverview />
      <NewsletterEtc />
      <Footer />
    </Flex>
  )
})

export default Fold
