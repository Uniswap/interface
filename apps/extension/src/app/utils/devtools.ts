if (process.env.NODE_ENV === 'development' && window.location.search.includes('why-did-you-render')) {
  require('./whyDidYouRender')
}
