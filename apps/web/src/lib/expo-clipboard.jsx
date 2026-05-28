// Basic clipboard functionality
const Clipboard = {
  setStringAsync: async (text) => {
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        return { content: text }
      } catch (e) {
        console.warn('Clipboard write failed:', e)
        return null
      }
    }
    console.warn('Clipboard API not available')
    return null
  },

  getStringAsync: async () => {
    // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText()
        return text
      } catch (e) {
        console.warn('Clipboard read failed:', e)
        return ''
      }
    }
    console.warn('Clipboard API not available')
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
// oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
const createPasteButton = (options = {}) => {
  console.warn('ClipboardPasteButton is mocked and will not render a real button')

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
            console.error('Error in paste button:', e)
          }
        },
      },
    }
  }
}

const hasStringAsync = async () => {
  return false
}

// Named exports
export { Clipboard, createPasteButton as ClipboardPasteButton, hasStringAsync }
