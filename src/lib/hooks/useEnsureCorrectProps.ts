import { WidgetProps } from 'lib/components/Widget'
import { missingProviderError } from 'lib/errors'
import { useEffect } from 'react'

export function useEnsureCorrectProps(props: WidgetProps) {
  useEffect(() => {
    if (!props.provider) {
      throw missingProviderError
    }
  }, [props])
}
