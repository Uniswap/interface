declare module '*.svg' {
  import React from 'react'
  import { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  // eslint-disable-next-line import/no-unused-modules
  export default content
}
