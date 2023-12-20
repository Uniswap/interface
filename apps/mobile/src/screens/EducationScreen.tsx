import React, { useMemo } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { Carousel } from 'src/components/carousel/Carousel'
import { educationContent } from 'src/components/education'
import { Screen } from 'src/components/layout/Screen'
import { IS_IOS } from 'src/constants/globals'
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
    <Screen edges={IS_IOS ? [] : ['top']} mt={IS_IOS ? '$spacing24' : '$spacing8'}>
      <Carousel slides={content} />
    </Screen>
  )
}
