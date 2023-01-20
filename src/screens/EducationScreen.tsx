import React, { useMemo } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { Carousel } from 'src/components/carousel/Carousel'
import { educationContent } from 'src/components/education'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Screens } from 'src/screens/Screens'

export function EducationScreen({
  route: {
    params: { type },
  },
}: AppStackScreenProp<Screens.Education>): JSX.Element {
  const content = useMemo(() => educationContent[type](), [type])

  return (
    <SheetScreen flex={1}>
      <Carousel slides={content} />
    </SheetScreen>
  )
}
