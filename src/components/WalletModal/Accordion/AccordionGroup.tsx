import { ReactNode, useState } from 'react'

import { OptionGrid } from '..'
import Accordion from '.'

export default function AccordionGroup({ options }: { options: { header: ReactNode; text: ReactNode }[] }) {
  // Allows one accordion to be open at a time
  const [openIndex, setOpenIndex] = useState<number>()

  return (
    <OptionGrid>
      {options.map(({ header, text }, index) => (
        <Accordion
          key={index}
          open={openIndex === index}
          setOpen={(open) => setOpenIndex(open ? index : undefined)}
          header={header}
        >
          {text}
        </Accordion>
      ))}
    </OptionGrid>
  )
}
