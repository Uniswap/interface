import { Children, isValidElement, type ReactNode, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Flex } from 'ui/src/components/layout'

/**
 * Function to check if a child is either a direct Trans component or if it's a function component that resolves to render Trans
 **/
const hasDirectOrResolvedTransChild = (child: ReactNode): boolean => {
  if (!isValidElement(child)) {
    return false // Not a valid React element (e.g., plain text or null)
  }

  // Case 1: Direct match with Trans
  if (child.type === Trans) {
    return true
  }

  // Generic Case 2: We expect `Flex` to be the direct child of `Button`
  if (child.type === Flex) {
    return false
  }

  // Case 3: Everything else
  return true
}

export const useIsStringOrTransTag = (children: ReactNode): boolean => {
  const arrayedChildren = useMemo(() => Children.toArray(children), [children])
  const numberOfArrayedChildren = Children.count(children)
  const firstChild = arrayedChildren[0]

  const isChildrenAString = typeof children === 'string'

  const isStringOrTransTag = useMemo(() => {
    if (isChildrenAString) {
      return true
    }

    return numberOfArrayedChildren === 1 && hasDirectOrResolvedTransChild(firstChild)
  }, [isChildrenAString, numberOfArrayedChildren, firstChild])

  return isStringOrTransTag
}
