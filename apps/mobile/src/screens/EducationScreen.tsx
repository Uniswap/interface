import React, { useMemo } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { Carousel } from 'src/components/carousel/Carousel'
import { educationContent } from 'src/components/education'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'
import { isIOS } from 'uniswap/src/utils/platform'

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
    <Screen edges={isIOS ? [] : ['top']} mt={isIOS ? '$spacing24' : '$spacing8'}>
      <Carousel slides={content} />
    </Screen>
  )
}
