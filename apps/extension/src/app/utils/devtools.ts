// oxlint-disable-next-line eslint-js/no-restricted-syntax allow process.env access for tree shaking
if (process.env.NODE_ENV === 'development' && window.location.search.includes('why-did-you-render')) {
  require('./whyDidYouRender')
}
