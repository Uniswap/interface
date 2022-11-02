/**
 * @generated SignedSource<<075a48fc5c286ce2a0026f6105a67dfc>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type SafetyLevel = "BLOCKED" | "MEDIUM_WARNING" | "STRONG_WARNING" | "VERIFIED" | "%future added value";
export type balancesQuery$variables = {
  ownerAddress: string;
};
export type balancesQuery$data = {
  readonly portfolios: ReadonlyArray<{
    readonly tokenBalances: ReadonlyArray<{
      readonly denominatedValue: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly quantity: number | null;
      readonly token: {
        readonly address: string | null;
        readonly chain: Chain;
        readonly decimals: number | null;
        readonly name: string | null;
        readonly symbol: string | null;
      } | null;
      readonly tokenProjectMarket: {
        readonly relativeChange24: {
          readonly value: number;
        } | null;
        readonly tokenProject: {
          readonly logoUrl: string | null;
          readonly safetyLevel: SafetyLevel | null;
        };
      } | null;
    } | null> | null;
  } | null> | null;
};
export type balancesQuery = {
  response: balancesQuery$data;
  variables: balancesQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "ownerAddress"
  }
],
v1 = [
  {
    "items": [
      {
        "kind": "Variable",
        "name": "ownerAddresses.0",
        "variableName": "ownerAddress"
      }
    ],
    "kind": "ListValue",
    "name": "ownerAddresses"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "quantity",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "decimals",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "safetyLevel",
  "storageKey": null
},
v12 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "balancesQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenBalance",
            "kind": "LinkedField",
            "name": "tokenBalances",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "denominatedValue",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  (v4/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Token",
                "kind": "LinkedField",
                "name": "token",
                "plural": false,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TokenProjectMarket",
                "kind": "LinkedField",
                "name": "tokenProjectMarket",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "TokenProject",
                    "kind": "LinkedField",
                    "name": "tokenProject",
                    "plural": false,
                    "selections": [
                      (v10/*: any*/),
                      (v11/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "relativeChange24",
                    "args": (v12/*: any*/),
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "pricePercentChange",
                    "plural": false,
                    "selections": [
                      (v4/*: any*/)
                    ],
                    "storageKey": "pricePercentChange(duration:\"DAY\")"
                  }
                ],
                "storageKey": null
              }
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
    "name": "balancesQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Portfolio",
        "kind": "LinkedField",
        "name": "portfolios",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenBalance",
            "kind": "LinkedField",
            "name": "tokenBalances",
            "plural": true,
            "selections": [
              (v2/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "denominatedValue",
                "plural": false,
                "selections": [
                  (v3/*: any*/),
                  (v4/*: any*/),
                  (v13/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Token",
                "kind": "LinkedField",
                "name": "token",
                "plural": false,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v7/*: any*/),
                  (v8/*: any*/),
                  (v9/*: any*/),
                  (v13/*: any*/)
                ],
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "TokenProjectMarket",
                "kind": "LinkedField",
                "name": "tokenProjectMarket",
                "plural": false,
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "TokenProject",
                    "kind": "LinkedField",
                    "name": "tokenProject",
                    "plural": false,
                    "selections": [
                      (v10/*: any*/),
                      (v11/*: any*/),
                      (v13/*: any*/)
                    ],
                    "storageKey": null
                  },
                  {
                    "alias": "relativeChange24",
                    "args": (v12/*: any*/),
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "pricePercentChange",
                    "plural": false,
                    "selections": [
                      (v4/*: any*/),
                      (v13/*: any*/)
                    ],
                    "storageKey": "pricePercentChange(duration:\"DAY\")"
                  },
                  (v13/*: any*/)
                ],
                "storageKey": null
              },
              (v13/*: any*/)
            ],
            "storageKey": null
          },
          (v13/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "aeee84c244e544f93ca19fc58cbe2ee2",
    "id": null,
    "metadata": {},
    "name": "balancesQuery",
    "operationKind": "query",
    "text": "query balancesQuery(\n  $ownerAddress: String!\n) {\n  portfolios(ownerAddresses: [$ownerAddress]) {\n    tokenBalances {\n      quantity\n      denominatedValue {\n        currency\n        value\n        id\n      }\n      token {\n        chain\n        address\n        name\n        symbol\n        decimals\n        id\n      }\n      tokenProjectMarket {\n        tokenProject {\n          logoUrl\n          safetyLevel\n          id\n        }\n        relativeChange24: pricePercentChange(duration: DAY) {\n          value\n          id\n        }\n        id\n      }\n      id\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "3e41902d2b5e0fa9149cb4f145f03a75";

export default node;
