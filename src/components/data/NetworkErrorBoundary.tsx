import React from 'react'
import { i18n } from 'src/app/i18n'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { NetworkError } from 'src/data/types'

interface NetworkErrorBoundaryState {
  error: NetworkError | null
}

type Props = {
  errorFallback?: ((error: NetworkError) => React.ReactNode) | React.ReactNode
}

/**
 * Inspired by: https://relay.dev/docs/guided-tour/rendering/error-states/
 */
export class NetworkErrorBoundary extends React.Component<Props, NetworkErrorBoundaryState> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: NetworkError): NetworkErrorBoundaryState {
    return { error }
  }

  render() {
    const { error } = this.state
    const { errorFallback, children } = this.props

    if (!error) {
      return children
    }

    if (error instanceof NetworkError) {
      if (typeof errorFallback === 'function') {
        return errorFallback(error)
      }
      return (
        errorFallback ?? (
          // TODO: remove this <Box> fallback. This is a temporary solution until we have better error UIs
          <Box alignContent="center" alignItems="center" flexGrow={1} justifyContent="center">
            <Text color="accentCritical">{i18n.t('Network failure')}</Text>
          </Box>
        )
      )
    } else {
      // this component only handles NetworkErrors
      throw error
    }
  }
}
