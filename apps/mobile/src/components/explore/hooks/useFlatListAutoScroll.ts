import { useEffect } from 'react'
import { FlatList } from 'react-native-gesture-handler'

interface UseFlatListAutoScrollOptions<T> {
  flatListRef: React.RefObject<FlatList<T> | null>
  selectedItem: T | null
  items: T[]
  scrollDelay?: number
}

/**
 * Custom hook to handle auto-scrolling in a FlatList based on a selected item
 * @param options - Configuration options for the auto-scroll behavior
 * @param options.flatListRef - Reference to the FlatList component
 * @param options.selectedItem - The currently selected item (null for "All" or first item)
 * @param options.items - Array of items to find the selected item's index
 * @param options.scrollDelay - Delay in ms before scrolling (default: 100)
 */
export function useFlatListAutoScroll<T>(options: UseFlatListAutoScrollOptions<T>): void {
  const { flatListRef, selectedItem, items, scrollDelay = 100 } = options

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | number | undefined

    if (flatListRef.current) {
      // If selectedItem is null (All/First option), scroll to the beginning
      if (selectedItem === null) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true })
      } else {
        // Find the index of the selected item in the items array
        const selectedIndex = items.findIndex((item) => item === selectedItem)
        if (selectedIndex !== -1) {
          // Use a small delay to ensure the FlatList is ready for scrolling
          timeoutId = setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: selectedIndex,
              animated: true,
              viewPosition: 0.5, // Center the item in the viewport
            })
          }, scrollDelay)
        }
      }
    }

    // Return cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [selectedItem, items, flatListRef, scrollDelay])
}
