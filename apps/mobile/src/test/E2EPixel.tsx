import { TouchableOpacity } from 'react-native'
import { config } from 'uniswap/src/config'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
/**
 * Workaround for E2E tests for the runner to access actions that
 * are hard to get to.
 *
 * For example, Gorham BSM doesn't support testID's on the backdrop
 * so we use expose this component during e2e tests to close the modal.
 */
export const E2EPixel = ({
  testID,
  onPress,
}: {
  testID: (typeof TestID)[keyof typeof TestID]
  onPress: () => void
}): JSX.Element => {
  if (config.isE2ETest) {
    return <TouchableOpacity style={{ width: 1, height: 1 }} testID={testID} onPress={onPress} />
  }
  return <></>
}
