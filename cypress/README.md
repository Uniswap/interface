# e2e testing with Cypress

End-to-end tests are run through [Cypress](https://docs.cypress.io/api/table-of-contents/), which runs tests in a real browser. Cypress is a little different than other testing frameworks, and e2e tests are a little different than unit tests, so this directory has its own set of patterns, idioms, and best practices. Not only that, but we're testing against a forked blockchain, not just against typical Web APIs, so we have unique flows that you may not have seen elsewhere.

## Running your first e2e tests

Cypress tests run against a local server, so you'll need to run the application locally at the same time. The fastest way to run e2e tests is to use your dev server: `yarn start`.

Open cypress at the same time with `yarn cypress:open`. You should do this from another window or tab, so that you can continue to see any typechecking/linting warnings from `yarn start`.

Cypress opens its own instance of Chrome, with a list of "E2E specs" for you to select. When you're developing locally, you usually only want to run one spec file at a time. Select your spec by clicking on the filename and it will run.

## Glossary

#### spec
Cypress considers each file a separate spec, or collection of tests.
Specs are always run as a whole through `yarn cypress:open` or on the same machine through CI.

#### Thenable
Cypress queues commands to run in the browser using [Thenables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#thenables), not Promises.
For this reason, you should not use `async/await` syntax in Cypress unless it is wholly-contained in a `cy.then` function argument.

## Writing your first e2e test

_For an excellent treatment on tests, check out the [Cypress Fundamentals](https://learn.cypress.io/cypress-fundamentals/how-to-write-a-test) course._
_While some of that will be paraphrased here, this should be sufficient to get you started:_

### What is a test?

Cypress tests are just like any other test: you should set up an initial state, execute an action, and verify the action's consequence. This is codified in the AAA (Arrange-Act-Assert) pattern, and you'll see this in most of our tests. In _our_ case, it plays out as:

1. Arrange: Visit a page, eg `cy.visit('/swap')`, and set up the state, on the blockchain and the page.
2. Act: Initiate your action under test, eg `initiateSwap()`
3. Assert: Verify that the action has occured, eg `// Verify swap has occured`

You'll usually see the setup, followed by a newline, followed by assertions with comments stating what they are asserting.
Because Cypress tests are translated into user actions, it may be hard to follow the action being described. You should use comments liberally to describe what you are doing and what you intend to test, to make tests easier to read and maintain in the future.

### Thinking about tests: queuing up a sequence of commands

Cypress uses `Thenable`s to achieve "command chaining". A test is described as a series of commands, which are only executed once the previous command in the chain has executed.

```
cy.visit('/swap')
cy.contains('Select token').click()
cy.contains('DAI').click()
```

In this example, `cy.contains('Select token').click()` is queued up right away (all the code is synchronous), but it will not execute until `/swap` has loaded (all the commands are chained); and `click()` will not execute until `Select token` has been found.

This becomes more relevant as you work with data on the blockchain, as you'll need to load it at the correct time, _after_ it's been modified by the application:

```
cy.hardhat().then(async (hardhat) => {
  cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
  cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
  cy.get('#swap-button').click()
  cy.contains('Confirm swap').click()

  // wait for the transaction to be executed
  cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
  cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

  // BAD: This will get the balance _before_ the other queued actions have executed.
  const balance = await hardhat.getBalance(hardhat.wallet, USDC_MAINNET)
  cy.wrap(balance).should('deep.equal', expectedBalance)
})
```

```
  cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
  cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
  cy.get('#swap-button').click()
  cy.contains('Confirm swap').click()

  // wait for the transaction to be executed
  cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
  cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')

  // GOOD: cy.then chains the command so that it runs _after_ executing the swap
  cy.hardhat()
    .then((hardhat) => hardhat.getBalance(hardhat.wallet, USDC_MAINNET))
    .should('deep.equal', expectedBalance)
})
```

### Working with the blockchain (ie hardhat)

Our tests use a local hardhat node to simulate blockchain transactions. This can be accessed with `cy.hardhat().then((hardhat) => ...)`.
Currently, tests using hardhat must opt-in in when they load the page: `cy.visit('/swap', { ethereum: 'hardhat' })`. This will not be necessary once we've totally migrated to hardhat.

By default, automining is turned on, so that any transaction that you send to the blockchain is mined immediately. If you want to assert on intermediate states (between sending a transaction and mining it), you can turn off automining: `cy.hardhat({ automine: false })`.

The hardhat integration has built-in utilities to let you modify and assert on balances, approvals, and permits, and should be fully typed. Check it out at [Uniswap/cypress-hardhat](https://github.com/Uniswap/cypress-hardhat).

### Asserting on wallet methods

Wallet methods to hardhat are all aliased. If you'd like to assert that a method was sent to the wallet, you can do so using the method name, prefixed with `@`:

```
// Asserts that `eth_sendRawTransaction` was sent to the wallet.
cy.wait('@eth_sendRawTransaction')
```

Sometimes, you may want a method to _fail_. In this case, you can stub it, but you should disable logging to avoid spamming the test:

```
// Stub calls to eth_signTypedData_v4 and fail them
cy.hardhat().then((hardhat) => {
  // Note the closure to keep signTypedDataStub in scope. Using closures instead of variables (eg let) helps prevent misuse of chaining.
  const signTypedDataStub = cy.stub(hardhat.provider, 'send').log(false)
  signTypedDataStub.withArgs('eth_signTypedData_v4).rejects(USER_REJECTION)
  signTypedDataStub.callThrough() // allws other methods to call through to hardhat

  cy.contains('Confirm swap').click()

  // Verify the call occured
  // Note the call to cy.wrap to correctly queue the chained command. Without this, the test would occur before the stub is called.
  cy.wrap(permitApprovalStub).should('be.calledWith', 'eth_signTypedData_v4')

  // Restore the stub
  // note the call to cy.then to correctly queue the chained command. Without this, the stub would be restored immediately.
  cy.then(() => permitApprovalStub.restore())
})
```

## Best practices

<!-- Best practices should all be labeled using H3, with the rationale italicized at the end of the section. -->
<!-- Best practice 🤣 is to also include an example before your rationale. -->

### Spec / test grouping

Each spec should be specific to one route, _not_ one functional behavior.
For example, `token-details.test.ts` is separated from `swap.test.ts`.

If a route has different functional behaviors, that route should become a directory name, and its spec should be split.
For example, `swap.test.ts` may be split into `swap/swap.test.ts`, `swap/wrap.test.ts`, `swap/permit2.test.ts`.

_This prevents specs from growing too large, which is important because they are always run as a whole locally and on the same machine through CI. If a spec grows too large, it will have a longer local feedback loop, and it will become the bottleneck for CI test runtime._

_Similarly, avoid actions outside the scope of your spec, as it will cause total testing time to increase._

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

_You'll still want to use `data-testid` in cases where the text is rendered in multiple containers and you need to select the correct one, or where the component doesn't render predictable text output._

### Avoid branching logic

Do not write tests that rely on if-statements or conditionals. Do not create helper methods which do more than one thing, and rely on branching logic to apply to different but similar situations.

_Tests should be readable and simple. Branching logic makes it harder to reason about tests, and may hide otherwise flaky or ill-defined behaviors._

_Similarly, you should avoid complicated for-loops. Sometimes, for simple repetition, for-loops are ok._

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
