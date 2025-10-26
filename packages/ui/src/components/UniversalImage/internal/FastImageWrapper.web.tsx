import { PlainImage } from 'ui/src/components/UniversalImage/internal/PlainImage'
import { FastImageWrapperProps } from 'ui/src/components/UniversalImage/types'

// For web, fall back to plain image
export function FastImageWrapper({ setError: _, ...rest }: FastImageWrapperProps): JSX.Element | null {
  return <PlainImage {...rest} />
}
