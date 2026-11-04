import { Text, type TextCompatProps, View, type ViewCompatProps, defaultWeights } from '@universe/mycelium'
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react'
import useResizeObserver from 'use-resize-observer'
import { Input, type InputProps } from '~/components/NumericalInput/NumericalInput'

// Explicit return types throughout this file: see "TS2883 on exported forwardRef wrappers" in
// packages/mycelium/CLAUDE.md.
export const NumericalInputWrapper: ForwardRefExoticComponent<ViewCompatProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, ViewCompatProps>(function NumericalInputWrapper(props, ref) {
    return (
      <View
        ref={ref}
        flexDirection="row"
        alignItems="center"
        position="relative"
        maxWidth="100%"
        width="max-content"
        transition="none"
        {...props}
      />
    )
  })

// Hidden-mimic width measurement can land fractions of a pixel short of the real input's
// required width, which is enough for `text-overflow: ellipsis` to clip the last character.
const ROUNDING_BUFFER = 1

/** Measures a hidden `NumericalInputMimic` so `StyledNumericalInput` can size itself to its content. */
export function useMeasuredFieldWidth(value: string | number | undefined) {
  const { ref, width } = useResizeObserver<HTMLElement>()
  const fieldWidth = value && width ? width + ROUNDING_BUFFER : undefined
  return { ref, fieldWidth }
}

export type StyledNumericalInputLayoutProps = {
  hasPrefix?: boolean
  /** Pixel width for the amount field (from hidden mimic measurement). */
  fieldWidth?: number
  numericalFontSize?: number
  prefixWidth?: number
}

type NumericalInputRef = ComponentRef<typeof Input>

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
    // Literal weight: Tamagui swallows font `$tokens` when styling the plain (non-Tamagui) Input
    fontWeight={defaultWeights.book}
    lineHeight={60}
    {...inputProps}
    textAlign={textAlign}
  />
))
StyledNumericalInput.displayName = 'StyledNumericalInput'

const MimicFrame: ForwardRefExoticComponent<TextCompatProps & RefAttributes<HTMLElement>> = forwardRef<
  HTMLElement,
  TextCompatProps
>(function MimicFrame({ style, ...props }, ref) {
  return (
    <Text
      ref={ref}
      position="absolute"
      // `visibility` isn't on the curated `$platform-web` surface yet, so the style escape hatch
      // carries it. Merge, don't replace: SendCurrencyInputForm passes its own `style` (measured
      // lineHeight/fontSize) into this component, and JSX doesn't deep-merge `style` across props,
      // so a bare `style={{ visibility: 'hidden' }}` here silently lost the hidden treatment on
      // that call site. `style` is pulled out of `props` above so the trailing spread below can't
      // clobber this merge back to the caller's raw value.
      style={{ visibility: 'hidden', ...style }}
      pointerEvents="none"
      bottom={0}
      right={0}
      textAlign="left"
      fontWeight="$book"
      lineHeight={60}
      {...props}
    />
  )
})

type NumericalInputMimicProps = ComponentPropsWithoutRef<typeof MimicFrame> & {
  numericalFontSize?: number
}

type MimicRef = ComponentRef<typeof MimicFrame>

export const NumericalInputMimic: ForwardRefExoticComponent<NumericalInputMimicProps & RefAttributes<MimicRef>> =
  forwardRef<MimicRef, NumericalInputMimicProps>(function NumericalInputMimic({ numericalFontSize, ...props }, ref) {
    return <MimicFrame ref={ref} fontSize={numericalFontSize ?? 70} {...props} />
  })

export type SymbolFrameProps = TextCompatProps & { showPlaceholder?: boolean }

const SymbolFrame: ForwardRefExoticComponent<SymbolFrameProps & RefAttributes<HTMLElement>> = forwardRef<
  HTMLElement,
  SymbolFrameProps
>(function SymbolFrame({ showPlaceholder, ...rest }, ref) {
  return (
    <Text
      ref={ref}
      userSelect="none"
      textAlign="left"
      fontWeight="$book"
      lineHeight={60}
      color={showPlaceholder ? '$neutral3' : '$neutral1'}
      {...rest}
    />
  )
})

type NumericalInputSymbolContainerProps = ComponentPropsWithoutRef<typeof SymbolFrame> & {
  showPlaceholder: boolean
  numericalFontSize?: number
}

type SymbolRef = ComponentRef<typeof SymbolFrame>

export const NumericalInputSymbolContainer: ForwardRefExoticComponent<
  NumericalInputSymbolContainerProps & RefAttributes<SymbolRef>
> = forwardRef<SymbolRef, NumericalInputSymbolContainerProps>(function NumericalInputSymbolContainer(
  { showPlaceholder, numericalFontSize, ...props },
  ref,
) {
  return <SymbolFrame ref={ref} showPlaceholder={showPlaceholder} fontSize={numericalFontSize ?? 70} {...props} />
})
