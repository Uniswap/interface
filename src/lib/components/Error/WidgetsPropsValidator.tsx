import { SUPPORTED_LOCALES } from 'constants/locales'
import { WidgetProps } from 'lib/components/Widget'
import { IntegrationError } from 'lib/errors'
import { PropsWithChildren, useEffect } from 'react'

export default function WidgetsPropsValidator(props: PropsWithChildren<WidgetProps>) {
  const { jsonRpcEndpoint, provider } = props

  useEffect(() => {
    if (!provider && !jsonRpcEndpoint) {
      throw new IntegrationError('This widget requires a provider or jsonRpcEndpoint.')
    }
  }, [provider, jsonRpcEndpoint])

  const { width } = props
  useEffect(() => {
    if (width && width < 300) {
      throw new IntegrationError(`Set widget width to at least 300px. (You set it to ${width}.)`)
    }
  }, [width])

  const { locale } = props
  useEffect(() => {
    if (locale && locale !== 'pseudo' && !SUPPORTED_LOCALES.includes(locale)) {
      console.warn('Unsupported locale: ', locale)
    }
  }, [locale])

  return <>{props.children}</>
}
