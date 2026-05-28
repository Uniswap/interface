// Mock for Node.js tty module to work in browser environment
// Used by @storybook/instrumenter

module.exports = {
  isatty: function () {
    return false
  },
  ReadStream: function () {},
  WriteStream: function () {},
}
