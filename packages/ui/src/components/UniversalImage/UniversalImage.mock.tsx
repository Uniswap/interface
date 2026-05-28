import React from 'react'

export function UniversalImage({
  uri,
  fallback,
  testID,
}: {
  uri?: string
  fallback?: React.ReactNode
  testID?: string
}): React.ReactNode {
  if (!uri) {
    return fallback ?? null
  }
  return <img src={uri} data-testid={testID || 'universal-image'} />
}
