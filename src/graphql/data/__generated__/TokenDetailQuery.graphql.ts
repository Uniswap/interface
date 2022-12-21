/**
 * @generated SignedSource<<4cb34c689111efa945b89c237f20afe9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type TokenDetailQuery$variables = {
  contract: ContractInput;
};
export type TokenDetailQuery$data = {
  readonly tokenProjects: ReadonlyArray<{
    readonly description: string | null;
    readonly homepageUrl: string | null;
    readonly markets: ReadonlyArray<{
      readonly fullyDilutedMarketCap: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly marketCap: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly price: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly priceHigh52W: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly priceLow52W: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly volume24h: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
    } | null> | null;
    readonly name: string | null;
    readonly tokens: ReadonlyArray<{
      readonly address: string | null;
      readonly chain: Chain;
      readonly decimals: number | null;
      readonly symbol: string | null;
    }>;
    readonly twitterName: string | null;
  } | null> | null;
};
export type TokenDetailQuery = {
  response: TokenDetailQuery$data;
  variables: TokenDetailQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "contract"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "contracts.0",
        "variableName": "contract"
      }
    ],
    "kind": "ListValue",
    "name": "contracts"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "homepageUrl",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "twitterName",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v6 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": [
      "USD"
    ]
  }
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v9 = [
  (v7/*: any*/),
  (v8/*: any*/)
],
v10 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v11 = {
  "kind": "Literal",
  "name": "duration",
  "value": "YEAR"
},
v12 = [
  (v11/*: any*/),
  {
    "kind": "Literal",
    "name": "highLow",
    "value": "HIGH"
  }
],
v13 = [
  (v11/*: any*/),
  {
    "kind": "Literal",
    "name": "highLow",
    "value": "LOW"
  }
],
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "decimals",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v19 = [
  (v7/*: any*/),
  (v8/*: any*/),
  (v18/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TokenDetailQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "tokenProjects",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": (v6/*: any*/),
            "concreteType": "TokenProjectMarket",
            "kind": "LinkedField",
            "name": "markets",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume24h",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "priceHigh52W",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": (v13/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              }
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v14/*: any*/),
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "TokenDetailQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "tokenProjects",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": (v6/*: any*/),
            "concreteType": "TokenProjectMarket",
            "kind": "LinkedField",
            "name": "markets",
            "plural": true,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume24h",
                "args": (v10/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "priceHigh52W",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": (v13/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v19/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              },
              (v18/*: any*/)
            ],
            "storageKey": "markets(currencies:[\"USD\"])"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v14/*: any*/),
              (v15/*: any*/),
              (v16/*: any*/),
              (v17/*: any*/),
              (v18/*: any*/)
            ],
            "storageKey": null
          },
          (v18/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "49fd3cf33bd5d321c69d8d6ed7f8afd9",
    "id": null,
    "metadata": {},
    "name": "TokenDetailQuery",
    "operationKind": "query",
    "text": "query TokenDetailQuery(\n  $contract: ContractInput!\n) {\n  tokenProjects(contracts: [$contract]) {\n    description\n    homepageUrl\n    twitterName\n    name\n    markets(currencies: [USD]) {\n      price {\n        value\n        currency\n        id\n      }\n      marketCap {\n        value\n        currency\n        id\n      }\n      fullyDilutedMarketCap {\n        value\n        currency\n        id\n      }\n      volume24h: volume(duration: DAY) {\n        value\n        currency\n        id\n      }\n      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {\n        value\n        currency\n        id\n      }\n      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {\n        value\n        currency\n        id\n      }\n      id\n    }\n    tokens {\n      chain\n      address\n      symbol\n      decimals\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "e8ff8936e05fa42a5d87fe0a2feb6b6e";

export default node;
