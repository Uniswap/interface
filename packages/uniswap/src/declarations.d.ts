declare module '*.svg' {
  import React from 'react'
  // eslint-disable-next-line no-restricted-imports
  import { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  export default content
}
