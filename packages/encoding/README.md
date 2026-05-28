# @universe/encoding

Encoding utilities and helpers

## Background

Centralizes the byte \<-\> base64 \<-\> base64url conversions duplicated across
different code paths. Consumers depend on one shared implementation instead of
hand-rolling `btoa`/`atob` wrappers or missing padding edge cases.

## Testing

``` sh
bun nx run encoding:test
```

### Regressions

While migrating code from other packages and replacing differing
implementations by a single canonical helper, it's useful to check all
input/output pairs match where we expect them to. In addition to traditional
unit tests, this package includes "regression" (parity) tests on functions
directly in test files. These internal test functions represent code that was
replaced across different packages and is useful for demonstration.

*Parity tests can be removed after migration.*
