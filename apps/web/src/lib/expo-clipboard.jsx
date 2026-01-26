// Basic clipboard functionality
const Clipboard = {
  setStringAsync: async (text) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        return { content: text }
      } catch (e) {
        return null
      }
    }
    return null
  },

  getStringAsync: async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText()
        return text
      } catch (e) {
        return ''
      }
    }
    return ''
  },

  hasStringAsync: async () => {
    try {
      const text = await Clipboard.getStringAsync()
      return text.length > 0
    } catch {
      return false
    }
  },
}

// Non-JSX implementation of ClipboardPasteButton
const createPasteButton = (options = {}) => {
  // This returns a function that will create a simple button element when called
  return function ClipboardPasteButton(props) {
    // If this gets called, we'll return a simple object instead of JSX
    return {
      type: 'div',
      props: {
        ...props,
        onClick: async () => {
          try {
            const text = await Clipboard.getStringAsync()
            if (props.onPress) {
              props.onPress({ text })
            }
          } catch (e) {
            // Error handling
          }
        },
      },
    }
  }
}

const hasStringAsync = async () => {
  return false
}

// Export the mock components and functions
export default Clipboard

// Named exports
export { Clipboard, createPasteButton as ClipboardPasteButton, hasStringAsync }
