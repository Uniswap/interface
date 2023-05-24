# e2e testing with Cypress

End-to-end tests are run through [Cypress](https://docs.cypress.io/api/table-of-contents/), which runs tests in a real browser. Cypress is a little different than other testing frameworks, and e2e tests are a little different than unit tests, so this directory has its own set of patterns, idioms, and best practices. Not only that, but we're testing against a forked blockchain, not just typical Web APIs, so we have unique flows that you may not have seen elsewhere.

## Running your first e2e tests

Cypress tests run against a local server, so you'll need to run the application locally at the same time. The fastest way to run e2e tests is to use your dev server: `yarn start`.

Open cypress at the same time with `yarn cypress:open`. You should do this from another window or tab, so that you can continue to see any typechecking/linting warnings from `yarn start`.

Cypress opens its own instance of Chrome, with a list of "E2E specs" for you to select. When you're developing locally, you usually only want to run one spec file at a time. Select your spec by clicking on the filename and it will run.

## Glossary

#### Spec
Cypress considers each file a separate Spec, or collection of tests.
Specs are always run as a whole through `yarn cypress:open` or on the same machine through CI.

#### Thennable
Cypress queues commands to run in the browser using Thennables, not Promises.
You should not use `async/await` syntax in Cypress unless it is wholly-contained in a `cy.then` function argument.

## Writing your first e2e test

TODO(zzmp)

## Working with the blockchain (ie hardhat)

TODO(zzmp)

## Best practices

<!-- Best practices should all be labeled using H3, with the rationale italicized at the end of the section. -->
<!-- Best practice 🤣 is to also include an example before your rationale. -->

### Spec / test grouping

Each Spec should be specific to one route, _not_ one functional behavior.
For example, `token-details.test.ts` is separated from `swap.test.ts`.

If a route has different functional behaviors, that route should become a directory name, and its Spec should be split.
For example, `swap.test.ts` may be split into `swap/swap.test.ts`, `swap/wrap.test.ts`, `swap/permit2.test.ts`.

_This prevents Specs from growing too large, which is important because they are always run as a whole locally and on the same machine through CI. If a Spec grows too large, it will have a longer local feedback loop, and it will become the bottleneck for CI test runtime._

### Use closures instead of variables

Avoid usage of `let`, instead assigning a constant. In practice, this means using closures for your variables:

```javascript
let badVariable

cy.hardhat({ automine: false })
  .then((hardhat) => cy.then(() => hardhat.provider.getBalance(hardhat.wallet.address)))
  .then((initialBalance) => {
    // Do not assign to a variable outside of your closure!
    badVariable = initialBalance // <-- bad!

    // Use initial balance here, within the closure.
  })

cy.get('.class-name').then((el) => {
  // Do not use badVariable here! It may have changed value due to the queued async nature of Cypress.
  expect(el).should('contain', badVariable) // <-- bad!
})
```

_This prevents misuse of a not-yet-initialized variable, or a variable that has changed as the test progresses._

### Prefer selecting elements using on-screen text over data-testid attributes

When selecting components (eg with `cy.get`), prefer defining your selector with visible UI. Sometimes this is not possible (eg if the text is duplicated on-screen), and you'll need to add a `data-testid` property.

_Defining tests using visual fields helps ensure that we don't break them. `data-testid` may select an element that is only selectable programmatically, and should be used only when necessary, as its use may cover up UI breakages._

### Avoid branching logic

Do not write tests that rely on if-statements or conditionals. Do not create helper methods which do more than one thing, and rely on branching logic to apply to different but similar situations.

_Tests should be readable and simple. Branching logic makes it harder to reason about tests, and may hide otherwise flaky or ill-defined behaviors._

### Avoid spamming the console

It is ok to include logging while you are developing a test, but that logging should be removed if it is not needed to debug (potential) errors.

For example, stubbing a wallet method will result in dumping a hex string (the calldata) to the log. Instead, suppress logging from methods which you know will flood the log.

```javascript
cy.stub(hardhat.wallet, 'sendTransaction')
  .log(false) // <-- suppresses logs from this stub
  .rejects(new Error('user cancelled'))
```

_Unnecessary logs it makes it harder to reason about a test overall._

### Name helper methods using transitive verbs

Name helper methods using "action verbs": `expectsThisToHappen`, not `expectThisToHappen`; `selectsToken(token: string)`, not `selectAToken(token: string)`.

_This makes your tests read more naturally, and makes it easier to follow given existing `should` syntax._
