declare module '*.svg' {
  import React from 'react'
  import { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  export default content
}

// uniwind's global.css is a side-effect import (`import 'src/global.css'`);
// declare the module so tsgo doesn't error TS2882 on it (it's compiled by
// uniwind's Metro transformer, not TypeScript).
declare module '*.css'
