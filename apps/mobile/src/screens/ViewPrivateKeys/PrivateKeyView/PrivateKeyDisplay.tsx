import { useMemo, useState } from 'react'
import { NativePrivateKeyDisplay } from 'src/screens/ViewPrivateKeys/PrivateKeyView/NativePrivateKeyDisplay'
import {
  NativePrivateKeyDisplayInternalProps,
  NativePrivateKeyDisplayProps,
} from 'src/screens/ViewPrivateKeys/PrivateKeyView/types'
import { Flex } from 'ui/src/components/layout/Flex'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

/**
 * For the given address, displays the private key in a native component so
 * that the React Native will never need to handle the private key. The
 * view allows the user to copy the private key to the clipboard.
 *
 * @param address - The address of the private key.
 */
export const PrivateKeyDisplay = ({ address, ...rest }: NativePrivateKeyDisplayProps): JSX.Element => {
  const [height, setHeight] = useState(0)
  const calculatedStyle: NativePrivateKeyDisplayInternalProps['style'] = useMemo(() => ({ height }), [height])

  const onHeightMeasured: NativePrivateKeyDisplayInternalProps['onHeightMeasured'] = (e) => {
    setHeight(Math.round(e.nativeEvent.height))
  }

  return (
    <Flex testID={TestID.ViewNativePrivateKey}>
      <NativePrivateKeyDisplay
        address={address}
        style={calculatedStyle}
        onHeightMeasured={onHeightMeasured}
        {...rest}
      />
    </Flex>
  )
}
