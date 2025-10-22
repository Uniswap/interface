// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { test as base } from '@playwright/test'
import path from 'path'
import { Mocks } from 'playwright/mocks/mocks'

type GraphqlFixture = {
  graphql: {
    /**
     * Intercepts a GraphQL operation and responds with a mock response.
     *
     * @param {string} operationName - The name of the GraphQL operation to intercept.
     * @param {string} mockPath - The path to the mock response file.
     * @param {Record<string, unknown>} [variables] - Optional variables to match against the request.
     *
     * If no variables are provided, all operations with the specified operationName will match and return the mock response.
     * If variables are provided, the request will only match if all variables match (case insensitive).
     */
    intercept: (operationName: string, mockPath: string, variables?: Record<string, unknown>) => Promise<void>
    waitForResponse: (operationName: string) => Promise<void>
  }
  interceptLongRunning: void
}

type InterceptConfig = {
  mockPath: string
  variables?: Record<string, unknown>
}

const interceptConfigs = new Map<string, InterceptConfig>()

export const test = base.extend<GraphqlFixture>({
  async graphql({ page }, use) {
    interceptConfigs.clear()

    // eslint-disable-next-line max-params
    const intercept = async (operationName: string, mockPath: string, variables?: Record<string, unknown>) => {
      interceptConfigs.set(operationName, { mockPath, variables })
    }

    const waitForResponse = async (operationName: string) => {
      try {
        await page.waitForResponse((response) => {
          if (!response.request().url().includes('graphql')) {
            return false
          }

          const postDataBuffer = response.request().postDataBuffer()
          if (!postDataBuffer) {
            return false
          }
          const postData = postDataBuffer.toString('utf-8')
          const data = JSON.parse(postData)
          return data.operationName === operationName
        })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('GraphQL waitForResponse error:', error)
      }
    }

    await page.route(/(?:interface|beta)\.(gateway|api)\.uniswap\.org\/v1\/graphql/, async (route) => {
      const request = route.request()
      const postData = request.postData()
      if (!postData) {
        return route.continue()
      }

      try {
        const { operationName, variables } = JSON.parse(postData)
        const config = interceptConfigs.get(operationName)

        if (config?.variables) {
          const matches = Object.keys(config.variables).every(
            (key) => variables[key]?.toString().toLowerCase() === config.variables?.[key]?.toString().toLowerCase(),
          )
          if (matches) {
            return route.fulfill({ path: path.resolve(__dirname, config.mockPath) })
          }
        } else if (config) {
          return route.fulfill({ path: path.resolve(__dirname, config.mockPath) })
        }

        return route.continue()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('GraphQL intercept error:', error)
        return route.continue()
      }
    })

    await use({ intercept, waitForResponse })
  },
  // Intercept long running graphql requests here:
  interceptLongRunning: [
    // eslint-disable-next-line no-empty-pattern
    async ({ graphql }, use) => {
      graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.test_wallet)
      await use(undefined)
    },
    { auto: true },
  ],
})
