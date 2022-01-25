import { WidgetProps } from 'lib/components/Widget'
import { IntegrationError } from 'lib/errors'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'

export default function WidgetsPropsValidator(props: PropsWithChildren<WidgetProps>) {
  const { jsonRpcEndpoint, provider } = props

  const [providerChecked, setProviderChecked] = useState(false)
  useEffect(() => {
    setProviderChecked(false)
    if (!provider && !jsonRpcEndpoint) {
      throw new IntegrationError('This widget requires a provider or jsonRpcEndpoint.')
    }
    setProviderChecked(true)
  }, [provider, jsonRpcEndpoint])

  // size constraints
  const [sizeConstraintsChecked, setSizeConstraintsChecked] = useState(false)
  const { width } = props
  useEffect(() => {
    setSizeConstraintsChecked(false)
    if (width && width < 300) {
      throw new IntegrationError('Set widget width to at least 300px.')
    }
    setSizeConstraintsChecked(true)
  }, [width])

  const propsChecked = useMemo(
    () => providerChecked && sizeConstraintsChecked,
    [providerChecked, sizeConstraintsChecked]
  )
  if (propsChecked) {
    return <>{props.children}</>
  }
  return null
}
