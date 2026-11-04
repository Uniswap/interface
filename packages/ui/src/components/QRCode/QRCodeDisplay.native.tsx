import { useSporeColors } from '@universe/mycelium'
import { borderRadii } from '@universe/mycelium/tokens'
import { memo, type PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import { QRCode } from 'ui/src/components/QRCode/QRCode'
import { resolveSporeColor } from 'ui/src/components/QRCode/resolveSporeColor'
import type { QRCodeDisplayProps } from 'ui/src/components/QRCode/types'

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // No inset offsets: the absolute overlay keeps its static position, which
  // the centering container places at the middle of the QR code.
  overlay: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: borderRadii.roundedFull,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'absolute',
  },
})

function QRCodeDisplayImpl({
  encodedValue,
  ecl = 'H',
  size,
  color,
  containerBackgroundColor,
  children,
}: PropsWithChildren<QRCodeDisplayProps>): JSX.Element {
  const colors = useSporeColors()
  const backgroundColor =
    containerBackgroundColor === undefined ? undefined : resolveSporeColor(colors, containerBackgroundColor)

  return (
    <View style={backgroundColor === undefined ? styles.container : [styles.container, { backgroundColor }]}>
      <QRCode
        backgroundColor={backgroundColor}
        color={color}
        ecl={ecl}
        overlayColor={colors.neutral1.val}
        size={size}
        value={encodedValue}
      />
      <View style={styles.overlay}>{children}</View>
    </View>
  )
}

export const QRCodeDisplay = memo(QRCodeDisplayImpl)
