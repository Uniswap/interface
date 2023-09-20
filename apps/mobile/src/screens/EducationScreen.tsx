import React, { useMemo } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { Carousel } from 'src/components/carousel/Carousel'
import { educationContent } from 'src/components/education'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Screens } from 'src/screens/Screens'

export function EducationScreen({
  route: {
    params: { type, importType, entryPoint },
  },
}: AppStackScreenProp<Screens.Education>): JSX.Element {
  const content = useMemo(
    () =>
      educationContent[type]({
        importType,
        entryPoint,
      }),
    [entryPoint, importType, type]
  )

  return (
    <SheetScreen>
      <Carousel slides={content} />
    </SheetScreen>
  )
}
