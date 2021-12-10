import React, { ErrorInfo } from 'react'
import ReactGA from 'react-ga'

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<unknown, ErrorBoundaryState> {
  constructor(props: unknown) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ReactGA.exception({
      ...error,
      ...errorInfo,
      fatal: true,
    })
  }
  render() {
    if (this.state.error) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}
