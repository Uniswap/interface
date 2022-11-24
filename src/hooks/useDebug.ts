import { useEffect, useRef } from 'react'

const instancesSet: { [title: string]: Set<Error> } = {}
let globalGroupLevel = 0

/**
 * Help detect reason of rerendering in React's components and hooks
 *
 * Usually use to detect why useEffect run. Place it along with useEffect, then pass all useEffect's dependencies into its props
 *
 * @params {object} props - dependencies need to watch for change
 * @params {RegExp | string} filter - filter debug which match `filter`
 *
 * @example
 * useDebug({ deps1, deps2, deps3, filter: 'at useExample' })
 * useEffect(() => {...}, [deps1, deps2, deps3])
 */
export default function useDebug(
  props: { [key: string]: any } & {
    filter?: RegExp | string
  },
) {
  const prevProps = useRef(props)
  const instanceRef = useRef(new Error())
  const trace = instanceRef.current.stack || ''
  const skipRealChanged = false // recommend: true
  const logOnlyOneInstance: number | undefined = undefined // use when debugging hooks reused in so many places, like useActiveWeb3React has hundred of instances

  const callerName = (() => {
    // https://stackoverflow.com/a/29572569/8153505
    const re = /(\w+)@|at (\w+) \(/g
    const m = (re.exec(trace), re.exec(trace))
    return m?.[1] || m?.[2] || ''
  })()
  const isMatch = props.filter
    ? typeof props.filter === 'string'
      ? trace.includes(props.filter)
      : props.filter.test(trace)
    : true

  useEffect(() => {
    if (!isMatch) return
    const instance = instanceRef.current
    if (!instancesSet[callerName]) instancesSet[callerName] = new Set()
    instancesSet[callerName].add(instance)
    return () => {
      instancesSet[callerName].delete(instance)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isMatch) return
    const instances = [...instancesSet[callerName]]
    const instanceIndex = instances.indexOf(instanceRef.current) + 1
    if (logOnlyOneInstance && instanceIndex !== logOnlyOneInstance) return
    globalGroupLevel = 0
    try {
      const changed = analyzeChanged(prevProps.current, props)
      if (!changed) return
      if (!changed.isObject) return
      if (changed.isRealChanged && skipRealChanged) return

      console.groupCollapsed(
        `%cDebug found changed %c${callerName} (${instanceIndex}/${instances.length}) ${
          changed.isRealChanged ? '' : '🆘 🆘 🆘'
        }`,
        'color: unset',
        'color: #b5a400',
      )
      globalGroupLevel++
      Object.keys(changed.subChanges).forEach(key => printChanged(changed.subChanges[key], key))
      console.groupCollapsed('Trace')
      globalGroupLevel++
      console.log(trace)
      console.groupEnd()
      globalGroupLevel--
      console.groupEnd()
      globalGroupLevel--
    } catch (e) {
      for (; globalGroupLevel-- > 0; console.groupEnd());
    }
    prevProps.current = props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(props))
}

type Changed =
  | {
      isObject: false
      oldValue: any
      newValue: any
    }
  | {
      isObject: true
      isRealChanged: boolean
      subChanges: { [key: string]: Changed }
    }
  | undefined // no changed

const analyzeChanged = (oldValue: any, newValue: any): Changed => {
  let result: Changed = undefined

  if (oldValue !== newValue) {
    if (isObjectOrArray(oldValue) && isObjectOrArray(newValue)) {
      // find which key is really changed for object and array
      const propSubKeys = new Set<string>()
      Object.keys(oldValue).forEach(subkey => propSubKeys.add(subkey))
      Object.keys(newValue).forEach(subkey => propSubKeys.add(subkey))
      const subResults = [...propSubKeys].map(
        subkey => [subkey, analyzeChanged(oldValue[subkey], newValue[subkey])] as const,
      )
      const isRealChanged = subResults.some(subResult => !subResult[1]?.isObject || subResult[1]?.isRealChanged)
      result = {
        isObject: true,
        subChanges: Object.fromEntries(subResults),
        isRealChanged,
      }
    } else {
      const printableOldValue = oldValue
      const printableNewValue = newValue
      result = {
        isObject: false,
        oldValue: printableOldValue,
        newValue: printableNewValue,
      }
    }
  }
  return result
}

const printChanged = (changed: Changed | undefined, name: string): void => {
  if (!changed) return
  const isRealChanged = !changed.isObject || changed.isRealChanged
  if (isRealChanged) {
    console.groupCollapsed(`%c${name} %creal changed`, 'color: #b5a400', 'color: green')
  } else {
    console.group(`%c${name} %cduplicated changed`, 'color: #b5a400', 'color: red')
  }
  globalGroupLevel++
  if (!changed.isObject) {
    console.log(' - Old:', changed.oldValue)
    console.log(' - New:', changed.newValue)
  } else {
    Object.keys(changed.subChanges).forEach(key => printChanged(changed.subChanges[key], key))
  }
  console.groupEnd()
  globalGroupLevel--
}

const isObjectOrArray = (obj: any): boolean => {
  return typeof obj === 'object' && obj !== null
}
