# Sentry Logging Best Practices

## Log Errors Over Strings

If you're manually logging an error, make sure you log an actual error object and not just a string.

Don't use: `logger.error('Invalid input')`
Do use: `logger.error(new Error('Invalid input')`

The reason is that new Error() makes it so that Sentry knows exactly where this was called. Otherwise, the stack trace is useless.

## Try/Catch

If you're using try/catch and then manually logging an error, make sure you log the error that you caught!

Don't use:

```typescript
try {
  ...
} catch(err) {
  logger.error(new Error('Invalid input'))
}
```

Do use:

```typescript
try {
  ...
} catch(err) {
  logger.error(err)
}
```

Alternatively, if you must have a custom error message, to preserve the stack trace of the caught error you could also do something fancy like this:

```typescript
try {
  ...
} catch(err) {
  const myCustomError = new Error('Invalid input')
  myCustomError.cause = err
  logger.error(myCustomError)
}
```

## Logging Additional Context

If you want to log extra information, use the extra field:

```typescript
logger.error(error, {
  extra: {
    swapFormState: {
      currencies,
      currencyAmounts,
    },
  },
})
```
