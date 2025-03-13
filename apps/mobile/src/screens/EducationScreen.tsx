import React, { useMemo } from 'react'
import { AppStackScreenProp, EducationContentType } from 'src/app/navigation/types'
import { Carousel } from 'src/components/carousel/Carousel'
import { SeedPhraseEducationContent } from 'src/components/education/SeedPhrase'
import { Screen } from 'src/components/layout/Screen'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { isIOS } from 'utilities/src/platform'

const educationContent = {
  [EducationContentType.SeedPhrase]: SeedPhraseEducationContent,
}

export function EducationScreen({
  route: {
    params: { type, importType, entryPoint },
  },
}: AppStackScreenProp<MobileScreens.Education>): JSX.Element {
  const content = useMemo(
    () =>
      educationContent[type]({
        importType,
        entryPoint,
      }),
    [entryPoint, importType, type],
  )

  return (
    <Screen edges={isIOS ? [] : ['top']} mt={isIOS ? '$spacing24' : '$spacing8'}>
      <Carousel slides={content} />
    </Screen>
  )
}
