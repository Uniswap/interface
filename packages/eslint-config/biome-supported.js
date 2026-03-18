// Below are the rules, we still need to migrate to biome
//
//  Rules that can be migrated to an inspired rule using --include-inspired:
//
//  - no-cond-assign
//  - no-labels
//  - object-shorthand
//  - @typescript-eslint/ban-ts-comment
//  - @typescript-eslint/explicit-function-return-type
//  - @typescript-eslint/naming-convention
//  - @typescript-eslint/no-empty-interface
//  - @typescript-eslint/no-this-alias
//  - jest/no-focused-tests
//  - jest/no-standalone-expect
//  - react/jsx-curly-brace-presence
//  - react/jsx-no-target-blank
//
//  Rules that can be migrated to a nursery rule using --include-nursery:
//
//  - max-params
//  - @typescript-eslint/no-floating-promises
//  - @typescript-eslint/no-non-null-asserted-optional-chain
//  - @typescript-eslint/no-unnecessary-condition
//
//  Stylistic rules that the formatter may support (manual migration required):
//
//  - eol-last
//  - jsx-quotes
//  - keyword-spacing
//  - new-parens
//  - no-extra-semi
//  - no-floating-decimal
//  - no-mixed-spaces-and-tabs
//  - semi-spacing
//  - space-infix-ops
//  - space-unary-ops
//
//  Unsupported rules:
//
//  - complexity
//  - consistent-return
//  - consistent-this
//  - handle-callback-err
//  - max-depth
//  - max-lines
//  - max-nested-callbacks
//  - no-caller
//  - no-catch-shadow
//  - no-delete-var
//  - no-div-regex
//  - no-extend-native
//  - no-extra-bind
//  - no-implied-eval
//  - no-invalid-regexp
//  - no-iterator
//  - no-mixed-requires
//  - no-negated-in-lhs
//  - no-new
//  - no-new-func
//  - no-new-object
//  - no-new-require
//  - no-octal
//  - no-path-concat
//  - no-proto
//  - no-restricted-modules
//  - no-restricted-syntax
//  - no-return-assign
//  - no-script-url
//  - prefer-spread
//  - @jambit/typed-redux-saga/delegate-effects
//  - @jambit/typed-redux-saga/use-typed-effects
//  - @typescript-eslint/func-call-spacing
//  - @typescript-eslint/no-duplicate-enum-values
//  - @typescript-eslint/no-shadow
//  - @typescript-eslint/no-unsafe-return
//  - @typescript-eslint/no-unused-expressions
//  - @typescript-eslint/triple-slash-reference
//  - check-file/no-index
//  - eslint-comments/no-aggregating-enable
//  - eslint-comments/no-unlimited-disable
//  - eslint-comments/no-unused-disable
//  - eslint-comments/no-unused-enable
//  - import/no-unused-modules
//  - jest/expect-expect
//  - jest/no-alias-methods
//  - jest/no-commented-out-tests
//  - jest/no-deprecated-functions
//  - jest/no-identical-title
//  - jest/no-interpolation-in-snapshots
//  - jest/no-jasmine-globals
//  - jest/no-mocks-import
//  - jest/no-test-prefixes
//  - jest/valid-expect
//  - jest/valid-expect-in-promise
//  - jest/valid-title
//  - local-rules/enforce-query-options-result
//  - local-rules/no-hex-string-casting
//  - local-rules/no-unwrapped-t
//  - local-rules/prevent-this-method-destructure
//  - no-relative-import-paths/no-relative-import-paths
//  - no-unsanitized/method
//  - no-unsanitized/property
//  - react/jsx-no-undef
//  - react/jsx-sort-props
//  - react/jsx-uses-react
//  - react/jsx-uses-vars
//  - react/no-deprecated
//  - react/no-did-mount-set-state
//  - react/no-did-update-set-state
//  - react/no-direct-mutation-state
//  - react/no-find-dom-node
//  - react/no-is-mounted
//  - react/no-render-return-value
//  - react/no-string-refs
//  - react/no-unescaped-entities
//  - react/no-unsafe
//  - react/no-unstable-nested-components
//  - react/require-render-return
//  - react/self-closing-comp
//  - react-native/no-unused-styles
//  - react-native/sort-styles
//  - rulesdir/i18n
//  - rulesdir/no-redux-modals
//  - security/detect-buffer-noassert
//  - security/detect-child-process
//  - security/detect-disable-mustache-escape
//  - security/detect-eval-with-expression
//  - security/detect-new-buffer
//  - security/detect-non-literal-regexp
//  - security/detect-pseudoRandomBytes
//  - security/detect-unsafe-regex
//
//  Paritally migrated!
//  - @typescript-eslint/no-restricted-imports - biome doesn't have allowTypeImports param.
//    So, keep this eslint rule for @uniswap/smart-order-router and react-native related imports

// Rules that have been migrated to Biome and should be disabled in ESLint
// by overriding them inside .eslintrc.* files, so eslint does not check them
module.exports = {
  // Standard ESLint rules
  curly: 'off',
  'dot-notation': 'off',
  eqeqeq: 'off',
  'for-direction': 'off',
  'no-alert': 'off',
  'no-async-promise-executor': 'off',
  'no-bitwise': 'off',
  'no-case-declarations': 'off',
  'no-class-assign': 'off',
  'no-compare-neg-zero': 'off',
  'no-console': 'off',
  'no-control-regex': 'off',
  'no-debugger': 'off',
  'no-dupe-else-if': 'off',
  'no-duplicate-case': 'off',
  'no-empty-character-class': 'off',
  'no-empty-pattern': 'off',
  'no-eval': 'off',
  'no-ex-assign': 'off',
  'no-extra-boolean-cast': 'off',
  'no-fallthrough': 'off',
  'no-global-assign': 'off',
  'no-irregular-whitespace': 'off',
  'no-label-var': 'off',
  'no-lone-blocks': 'off',
  'no-misleading-character-class': 'off',
  'no-new-wrappers': 'off',
  'no-nonoctal-decimal-escape': 'off',
  'no-octal-escape': 'off',
  'no-prototype-builtins': 'off',
  'no-regex-spaces': 'off',
  'no-restricted-globals': 'off',
  'no-self-assign': 'off',
  'no-self-compare': 'off',
  'no-sequences': 'off',
  'no-shadow-restricted-names': 'off',
  'no-sparse-arrays': 'off',
  'no-undef-init': 'off',
  'no-unsafe-finally': 'off',
  'no-unsafe-optional-chaining': 'off',
  'no-unused-labels': 'off',
  'no-useless-backreference': 'off',
  'no-useless-catch': 'off',
  'no-useless-escape': 'off',
  'no-var': 'off',
  'no-void': 'off',
  'no-with': 'off',
  'prefer-const': 'off',
  'prefer-rest-params': 'off',
  radix: 'off',
  'require-yield': 'off',
  'use-isnan': 'off',
  'valid-typeof': 'off',
  yoda: 'off',

  // TypeScript ESLint rules
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/no-array-constructor': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-extra-non-null-assertion': 'off',
  '@typescript-eslint/no-loss-of-precision': 'off',
  '@typescript-eslint/no-misused-new': 'off',
  '@typescript-eslint/no-namespace': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: '@uniswap/smart-order-router',
          message: 'Only import types, unless you are in the client-side SOR, to preserve lazy-loading.',
          allowTypeImports: true,
        },
      ],
    },
  ],
  '@typescript-eslint/no-unnecessary-type-constraint': 'off',
  '@typescript-eslint/no-unsafe-declaration-merging': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/prefer-as-const': 'off',
  '@typescript-eslint/prefer-enum-initializers': 'off',

  // Jest rules
  'jest/no-done-callback': 'off',

  // React rules
  'react/forbid-elements': 'off',
  'react/jsx-key': 'off',
  'react/jsx-no-comment-textnodes': 'off',
  'react/jsx-no-duplicate-props': 'off',
  'react/no-children-prop': 'off',
  'react/no-danger': 'off',
  'react/no-danger-with-children': 'off',

  // React Hooks rules
  'react-hooks/exhaustive-deps': 'off',
  'react-hooks/rules-of-hooks': 'off',

  // Unused imports
  'unused-imports/no-unused-imports': 'off',
}
