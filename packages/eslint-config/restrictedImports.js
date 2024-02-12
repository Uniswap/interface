exports.node = {
  paths: [
    {
      name: 'ethers',
      message: "Please import from '@ethersproject/module' directly to support tree-shaking.",
    },
  ],
  patterns: [
    {
      group: ['**/dist'],
      message: 'Do not import from dist/ - this is an implementation detail, and breaks tree-shaking.',
    },
  ],
}

exports.react = {
  paths: [
    ...exports.node.paths,
    {
      name: 'styled-components',
      message: 'Please import from styled-components/macro.',
    },
  ],
  patterns: exports.node.patterns,
}
