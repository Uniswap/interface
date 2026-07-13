import React, { forwardRef } from 'react'
import { styled, Text, type GetProps, View } from 'ui/src'
import { Input, type InputProps } from '~/components/NumericalInput/NumericalInput'

export const NumericalInputWrapper = styled(View, {
  flexDirection: 'row',
  alignItems: 'center',
  position: 'relative',
  maxWidth: '100%',
  width: 'max-content',
  transition: 'none',
})

export type StyledNumericalInputLayoutProps = {
  hasPrefix?: boolean
  /** Pixel width for the amount field (from hidden mimic measurement). */
  fieldWidth?: number
  numericalFontSize?: number
  prefixWidth?: number
}

type NumericalInputRef = React.ElementRef<typeof Input>

/** Buy/Send/Earn amount field: explicit `fontSize`, `maxHeight`, `textAlign`, etc. replace `StyledInput`’s `amountLayout` variant, so `amountLayout` is omitted from the public API. */
export const StyledNumericalInput = forwardRef<
  NumericalInputRef,
  StyledNumericalInputLayoutProps & Omit<InputProps, 'amountLayout'>
>(({ hasPrefix, fieldWidth, numericalFontSize, prefixWidth, textAlign = 'left', ...inputProps }, ref) => (
  <Input
    ref={ref}
    width={fieldWidth ?? 43}
    maxHeight={84}
    maxWidth={hasPrefix ? `calc(100% - ${prefixWidth ?? 43}px)` : '100%'}
    fontSize={numericalFontSize ?? 70}
    fontWeight="$book"
    lineHeight="$spacing60"
    {...inputProps}
    textAlign={textAlign}
  />
))
StyledNumericalInput.displayName = 'StyledNumericalInput'

const MimicFrame = styled(Text, {
  position: 'absolute',
  '$platform-web': { visibility: 'hidden' },
  pointerEvents: 'none',
  bottom: 0,
  right: 0,
  textAlign: 'left',
  fontWeight: '$book',
  lineHeight: '$spacing60',
})

type NumericalInputMimicProps = GetProps<typeof MimicFrame> & {
  numericalFontSize?: number
}

type MimicRef = React.ElementRef<typeof MimicFrame>

export const NumericalInputMimic = forwardRef<MimicRef, NumericalInputMimicProps>(function NumericalInputMimic(
  { numericalFontSize, ...props },
  ref,
) {
  return <MimicFrame ref={ref} fontSize={numericalFontSize ?? 70} {...props} />
})

const SymbolFrame = styled(Text, {
  userSelect: 'none',
  textAlign: 'left',
  fontWeight: '$book',
  lineHeight: '$spacing60',
  variants: {
    showPlaceholder: {
      true: {
        color: '$neutral3',
      },
      false: {
        color: '$neutral1',
      },
    },
  } as const,
})

type NumericalInputSymbolContainerProps = GetProps<typeof SymbolFrame> & {
  showPlaceholder: boolean
  numericalFontSize?: number
}

type SymbolRef = React.ElementRef<typeof SymbolFrame>

export const NumericalInputSymbolContainer = forwardRef<SymbolRef, NumericalInputSymbolContainerProps>(
  function NumericalInputSymbolContainer({ showPlaceholder, numericalFontSize, ...props }, ref) {
    return <SymbolFrame ref={ref} showPlaceholder={showPlaceholder} fontSize={numericalFontSize ?? 70} {...props} />
  },
)
