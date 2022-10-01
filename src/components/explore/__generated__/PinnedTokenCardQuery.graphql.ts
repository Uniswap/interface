/**
 * @generated SignedSource<<ef5b6494b1a5f3dda64ffca85556fc9e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type PinnedTokenCardQuery$variables = {
  contracts: ReadonlyArray<ContractInput>;
};
export type PinnedTokenCardQuery$data = {
  readonly tokenProjects: ReadonlyArray<{
    readonly logoUrl: string | null;
    readonly markets: ReadonlyArray<{
      readonly price: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
      readonly pricePercentChange24h: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
    } | null> | null;
    readonly tokens: ReadonlyArray<{
      readonly address: string | null;
      readonly chain: Chain;
      readonly symbol: string | null;
    }>;
  } | null> | null;
};
export type PinnedTokenCardQuery = {
  response: PinnedTokenCardQuery$data;
  variables: PinnedTokenCardQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "contracts"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "contracts",
    "variableName": "contracts"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
  "storageKey": null
},
v6 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": "USD"
  }
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v9 = [
  (v7/*: any*/),
  (v8/*: any*/)
],
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v11 = [
  (v7/*: any*/),
  (v8/*: any*/),
  (v10/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PinnedTokenCardQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "tokenProjects",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/)
            ],
            "storageKey": null
          },
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
                "name": "pricePercentChange24h",
                "plural": false,
                "selections": (v9/*: any*/),
                "storageKey": null
              }
            ],
            "storageKey": "markets(currencies:\"USD\")"
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
    "name": "PinnedTokenCardQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "TokenProject",
        "kind": "LinkedField",
        "name": "tokenProjects",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "Token",
            "kind": "LinkedField",
            "name": "tokens",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              (v3/*: any*/),
              (v4/*: any*/),
              (v10/*: any*/)
            ],
            "storageKey": null
          },
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
                "selections": (v11/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "pricePercentChange24h",
                "plural": false,
                "selections": (v11/*: any*/),
                "storageKey": null
              },
              (v10/*: any*/)
            ],
            "storageKey": "markets(currencies:\"USD\")"
          },
          (v10/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "4c9d4cfcb5de88c2f675781ac217dd33",
    "id": null,
    "metadata": {},
    "name": "PinnedTokenCardQuery",
    "operationKind": "query",
    "text": "query PinnedTokenCardQuery(\n  $contracts: [ContractInput!]!\n) {\n  tokenProjects(contracts: $contracts) {\n    tokens {\n      chain\n      address\n      symbol\n      id\n    }\n    logoUrl\n    markets(currencies: USD) {\n      price {\n        currency\n        value\n        id\n      }\n      pricePercentChange24h {\n        currency\n        value\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "7f13aa046f39225697b1396122afb3df";

export default node;
