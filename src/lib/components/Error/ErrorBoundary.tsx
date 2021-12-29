import { Trans } from '@lingui/macro'
import React, { ErrorInfo } from 'react'

import Dialog from '../Dialog'
import ErrorDialog from './ErrorDialog'

export type ErrorHandler = (error: Error, info: ErrorInfo) => void

interface ErrorBoundaryProps {
  onError?: ErrorHandler
}

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <Dialog color="dialog">
          <ErrorDialog
            error={this.state.error}
            header={<Trans>Reload the page to try again</Trans>}
            action={<Trans>Reload the page</Trans>}
            onAction={() => window.location.reload()}
          />
        </Dialog>
      )
    }
    return this.props.children
  }
}
