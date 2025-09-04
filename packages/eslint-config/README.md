# ESLint

## Custom Rules

### Prelude

In most cases, a [core](https://eslint.org/docs/latest/rules/) or community rule will suffice for your use case, as these rules tend to be robust and performant; use a custom rule when these rules cover too little for your specific use case (ie not robust/applicable) or too much (ie not performant).

### Steps

1. Ensure there is no available rule that sufficiently covers your use case
2. Create two files in `plugins/`: `<your-lint-name>.js` and `<your-lint-name>.test.js`
   - align naming with [ESLint core naming conventions](https://eslint.org/docs/latest/contribute/core-rules#rule-naming-conventions)
3. Create your lint rule using steps 2-4 [here](https://eslint.org/docs/latest/extend/custom-rule-tutorial#step-2-stub-out-the-rule-file)
   - it's much easier to find the node names (eg, JSXText, JSXExpressionContainer) for the visitor methods using [this explorer](https://astexplorer.net/)
4. [Add tests](https://eslint.org/docs/latest/extend/custom-rule-tutorial#step-6-write-the-test)
5. Import new rule to [`universe/eslint-local-rules`](../../eslint-local-rules.js)
6. Add your shiny new rule to [`native.js`](./native.js), [`base.js`](./base.js), and – if it's a react lint rule - [`react.js`](./react.js)
7. **Test, test, test**; cover all your bases
   - remember that this rule will checked against nearly every single LOC in the codebase
8. Profile with `TIMING=1 bun g:lint` and ensure your rule is **performant**
   - rules should generally not exceed 25 ms (~1%) for each package

### Tips and resources

- For configurable lists (eg greenlisted elements), lean towards passing a variable as a rule config rather than using a const, so as to avoid having to update the rule itself as the codebase evolves
- Avoid traversing children in a custom rule to avoid performance issues. Ideally, you target the nodes directly
- As with any lint rule, make sure the tradeoff in DevX (eg slower lint times, more styling considerations) is worth the benefits
- Utilize the [ESLint docs](https://eslint.org/docs/latest/extend/custom-rules)
