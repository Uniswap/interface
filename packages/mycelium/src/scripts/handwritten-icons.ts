/**
 * Hand-written icon components in src/components/icons that the generator
 * must never overwrite (INFRA-2956). These 14 files carry 16 export names
 * (Caret.tsx exports Caret, _Caret, and AnimatedCaretChange).
 *
 * If an SVG source ever lands whose derived component name collides with one
 * of these, the generator fails loudly instead of clobbering the port —
 * rename the SVG or delete the hand-written file first, deliberately.
 */
export const HANDWRITTEN_ICON_COMPONENTS: ReadonlySet<string> = new Set([
  'BackArrow',
  'Caret',
  'ChevronLeft',
  'CloseIconWithHover',
  'EarnSparkle',
  'EmptyPoolsIcon',
  'GoogleLogoGradient',
  'HeartWithFill',
  'Magic',
  'OSDynamicCloudIcon',
  'OnboardingUnicon',
  'RightArrowDashed',
  'RotatableChevron',
  'Unitag',
])

export function assertNotHandwritten(className: string, svgFileName: string): void {
  if (HANDWRITTEN_ICON_COMPONENTS.has(className)) {
    throw new Error(
      `SVG source "${svgFileName}" derives component name "${className}", which is a hand-written icon file — ` +
        `generating would overwrite the plain-React port. Rename the SVG or remove "${className}" from ` +
        `HANDWRITTEN_ICON_COMPONENTS (and delete the hand-written file) if the generated output should win.`,
    )
  }
}
