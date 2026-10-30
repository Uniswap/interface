import { useSporeColors } from '@universe/mycelium'
import { FlexCompat } from '@universe/mycelium/flex-compat'
import { memo, type PropsWithChildren } from 'react'
import { QRCode } from 'ui/src/components/QRCode/QRCode'
import type { QRCodeDisplayProps } from 'ui/src/components/QRCode/types'
import { resolveSporeColor } from 'ui/src/theme/color/resolveSporeColor'

function QRCodeDisplayImpl({
  encodedValue,
  ecl = 'H',
  size,
  color,
  containerBackgroundColor,
  children,
}: PropsWithChildren<QRCodeDisplayProps>): JSX.Element {
  const colors = useSporeColors()
  // Resolved here (not left to FlexCompat) because the QRCode svg needs the
  // same concrete color for its fill.
  const backgroundColor =
    containerBackgroundColor === undefined ? undefined : resolveSporeColor(colors, containerBackgroundColor)

  return (
    <FlexCompat alignItems="center" backgroundColor={backgroundColor} justifyContent="center" position="relative">
      <QRCode
        backgroundColor={backgroundColor}
        color={color}
        ecl={ecl}
        overlayColor={colors.neutral1.val}
        size={size}
        value={encodedValue}
      />
      {/* No inset offsets: the absolute overlay keeps its static position, which
          the centering flex container places at the middle of the QR code (same
          layout Yoga produces on native). */}
      <FlexCompat
        alignItems="center"
        backgroundColor="$transparent"
        borderRadius="$roundedFull"
        justifyContent="center"
        overflow="visible"
        position="absolute"
      >
        {children}
      </FlexCompat>
    </FlexCompat>
  )
}

export const QRCodeDisplay = memo(QRCodeDisplayImpl)
