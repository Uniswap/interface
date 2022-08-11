import { useEffect, useRef } from 'react'

/**
 * Help detect reason of rerendering in React's components and hooks
 *
 * @params {object} props - dependency need to watch for change
 */
export default function useDebug(
  props: { [key: string]: any } & {
    title: string
  },
) {
  const prevProps = useRef(props)
  const trace = Error('Trace').stack
  // const skipRealChanged = true // recommend: true

  useEffect(() => {
    const propKeys = new Set<string>()
    Object.keys(prevProps.current).forEach(key => propKeys.add(key))
    Object.keys(props).forEach(key => propKeys.add(key))
    let hasChanged = false
    propKeys.forEach(key => {
      if (props[key] !== prevProps.current[key]) hasChanged = true
    })
    if (hasChanged) {
      let hasRealChanged = false
      propKeys.forEach(key => {
        if (props[key] !== prevProps.current[key]) {
          const isRealChanged = JSON.stringify(prevProps.current[key]) !== JSON.stringify(props[key])
          if (isRealChanged) hasRealChanged = true
        }
      })
      // if (hasRealChanged && skipRealChanged) return

      console.groupCollapsed(
        `%c[${new Date().toISOString().slice(11, 19)}] %cDebug found changed %c${props.title} ${
          hasRealChanged ? '' : '🆘 🆘 🆘'
        }`,
        'color: #31CB9E',
        'color: unset',
        'color: #b5a400',
      )
      propKeys.forEach(key => {
        if (props[key] !== prevProps.current[key]) {
          const isRealChanged = JSON.stringify(prevProps.current[key]) !== JSON.stringify(props[key])
          // if (isRealChanged && skipRealChanged) return
          console.group(`%c${key}`, 'color: #b5a400')
          console.log('Is real changed:', isRealChanged, isRealChanged ? '' : '🆘 🆘 🆘')
          console.log(' - Old:', prevProps.current[key])
          console.log(' - New:', props[key])
          if (typeof prevProps.current[key] === 'object' && typeof props[key] === 'object' && isRealChanged) {
            // find which key is really changed for object and array
            const propSubKeys = new Set<string>()
            Object.keys(prevProps.current[key]).forEach(subkey => propSubKeys.add(subkey))
            Object.keys(props[key]).forEach(subkey => propSubKeys.add(subkey))
            propSubKeys.forEach(subkey => {
              if (props[key][subkey] !== prevProps.current[key][subkey]) {
                console.group('Subkey:', subkey)
                console.log(' - Old:', prevProps.current[key][subkey])
                console.log(' - New:', props[key][subkey])
                console.groupEnd()
              }
            })
          }
          console.groupEnd()
        }
      })
      console.groupCollapsed('Trace')
      console.log(trace)
      console.groupEnd()
      console.groupEnd()
    }
    prevProps.current = props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(props))
}
