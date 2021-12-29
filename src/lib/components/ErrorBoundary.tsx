import React, { ErrorInfo } from 'react'

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
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}
