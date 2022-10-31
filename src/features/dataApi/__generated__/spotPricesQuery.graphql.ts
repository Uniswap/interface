/**
 * @generated SignedSource<<2d2a3f8ff33c700a4c5bb7c27fab824d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type spotPricesQuery$variables = {
  contracts: ReadonlyArray<ContractInput>;
  skip: boolean;
};
export type spotPricesQuery$data = {
  readonly tokenProjects?: ReadonlyArray<{
    readonly markets: ReadonlyArray<{
      readonly price: {
        readonly value: number;
      } | null;
      readonly pricePercentChange24h: {
        readonly value: number;
      } | null;
    } | null> | null;
  } | null> | null;
};
export type spotPricesQuery = {
  response: spotPricesQuery$data;
  variables: spotPricesQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "contracts"
  },
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "skip"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "contracts",
    "variableName": "contracts"
  }
],
v2 = [
  {
    "kind": "Literal",
    "name": "currencies",
    "value": [
      "USD"
    ]
  }
],
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v4 = [
  (v3/*: any*/)
],
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v6 = [
  (v3/*: any*/),
  (v5/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "spotPricesQuery",
    "selections": [
      {
        "condition": "skip",
        "kind": "Condition",
        "passingValue": false,
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
                "args": (v2/*: any*/),
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
                    "selections": (v4/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "pricePercentChange24h",
                    "plural": false,
                    "selections": (v4/*: any*/),
                    "storageKey": null
                  }
                ],
                "storageKey": "markets(currencies:[\"USD\"])"
              }
            ],
            "storageKey": null
          }
        ]
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "spotPricesQuery",
    "selections": [
      {
        "condition": "skip",
        "kind": "Condition",
        "passingValue": false,
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
                "args": (v2/*: any*/),
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
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  },
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "pricePercentChange24h",
                    "plural": false,
                    "selections": (v6/*: any*/),
                    "storageKey": null
                  },
                  (v5/*: any*/)
                ],
                "storageKey": "markets(currencies:[\"USD\"])"
              },
              (v5/*: any*/)
            ],
            "storageKey": null
          }
        ]
      }
    ]
  },
  "params": {
    "cacheID": "e27049b5dd72cae5a6ca98527e6b9428",
    "id": null,
    "metadata": {},
    "name": "spotPricesQuery",
    "operationKind": "query",
    "text": "query spotPricesQuery(\n  $contracts: [ContractInput!]!\n  $skip: Boolean!\n) {\n  tokenProjects(contracts: $contracts) @skip(if: $skip) {\n    markets(currencies: [USD]) {\n      price {\n        value\n        id\n      }\n      pricePercentChange24h {\n        value\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "af5b9be8ceecb6325ca3d43c335e6e08";

export default node;
