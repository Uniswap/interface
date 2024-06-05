import { PlainImageProps, UniversalImageResizeMode } from 'ui/src/components/UniversalImage/types'
import { Flex } from 'ui/src/components/layout/Flex'
import { isJestRun } from 'utilities/src/environment'

export function PlainImage({ uri, size, resizeMode, style, testID }: PlainImageProps): JSX.Element {
  // TODO cover all cases better
  const objectFit =
    resizeMode === UniversalImageResizeMode.Contain || resizeMode === UniversalImageResizeMode.Cover
      ? resizeMode
      : 'contain'

  const imgElement = (
    <img
      height={size.height}
      src={uri}
      style={{ objectFit, aspectRatio: size.aspectRatio, ...style }}
      width={size.width}
    />
  )

  // TODO(MOB-3485): remove test run special casing
  if (isJestRun) {
    return <Flex testID={testID}>{imgElement}</Flex>
  } else {
    return imgElement
  }
}
