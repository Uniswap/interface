// Copied from:
// https://gist.github.com/phcbarros/bd90825863c3573cc0a28e90db17d1a4
const RNN = require('@react-navigation/native')
let listeners = {}
const setOptions = jest.fn()
const navigate = jest.fn()

const navigation = {
  setOptions,
  navigate,
  addListener: jest.fn((name, l) => (listeners[name] = l)),
  getListener: (name) => listeners[name],
  triggerListener: (name, ...params) => listeners[name](...params),
  resetListeners: () => {
    listeners = {}
  },
}

const useNavigation = () => navigation
let params = {}
const useRoute = () => ({
  params,
})

module.exports = {
  ...RNN,
  useNavigation,
  useRoute,
  setParams: (p) => (params = { ...params, ...p }),
}
