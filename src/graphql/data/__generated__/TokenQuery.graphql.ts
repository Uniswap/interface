/**
 * @generated SignedSource<<b6f87bb6b1c9e76c1439b3f580e27654>>
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
export type TokenQuery$variables = {
  contract: ContractInput;
};
export type TokenQuery$data = {
  readonly tokens: ReadonlyArray<{
    readonly address: string;
    readonly chain: Chain;
    readonly decimals: number | null;
    readonly id: string;
    readonly market: {
      readonly price: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly priceHigh52W: {
        readonly value: number;
      } | null;
      readonly priceLow52W: {
        readonly value: number;
      } | null;
      readonly totalValueLocked: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
      readonly volume24H: {
        readonly currency: Currency | null;
        readonly value: number;
      } | null;
    } | null;
    readonly name: string | null;
    readonly project: {
      readonly description: string | null;
      readonly homepageUrl: string | null;
      readonly logoUrl: string | null;
      readonly tokens: ReadonlyArray<{
        readonly address: string | null;
        readonly chain: Chain;
      }>;
      readonly twitterName: string | null;
    } | null;
    readonly symbol: string | null;
  } | null> | null;
};
export type TokenQuery = {
  response: TokenQuery$data;
  variables: TokenQuery$variables;
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
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "decimals",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
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
  "name": "symbol",
  "storageKey": null
},
v8 = [
  {
    "kind": "Literal",
    "name": "currency",
    "value": "USD"
  }
],
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v11 = [
  (v9/*: any*/),
  (v10/*: any*/)
],
v12 = [
  {
    "kind": "Literal",
    "name": "duration",
    "value": "DAY"
  }
],
v13 = {
  "kind": "Literal",
  "name": "duration",
  "value": "YEAR"
},
v14 = [
  (v13/*: any*/),
  {
    "kind": "Literal",
    "name": "highLow",
    "value": "HIGH"
  }
],
v15 = [
  (v9/*: any*/)
],
v16 = [
  (v13/*: any*/),
  {
    "kind": "Literal",
    "name": "highLow",
    "value": "LOW"
  }
],
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "description",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "homepageUrl",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "twitterName",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "logoUrl",
  "storageKey": null
},
v21 = [
  (v9/*: any*/),
  (v10/*: any*/),
  (v2/*: any*/)
],
v22 = [
  (v9/*: any*/),
  (v2/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TokenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Token",
        "kind": "LinkedField",
        "name": "tokens",
        "plural": true,
        "selections": [
          {
            "kind": "RequiredField",
            "field": (v2/*: any*/),
            "action": "LOG",
            "path": "tokens.id"
          },
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "kind": "RequiredField",
            "field": (v5/*: any*/),
            "action": "LOG",
            "path": "tokens.chain"
          },
          {
            "kind": "RequiredField",
            "field": (v6/*: any*/),
            "action": "LOG",
            "path": "tokens.address"
          },
          (v7/*: any*/),
          {
            "alias": null,
            "args": (v8/*: any*/),
            "concreteType": "TokenMarket",
            "kind": "LinkedField",
            "name": "market",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "totalValueLocked",
                "plural": false,
                "selections": (v11/*: any*/),
                "storageKey": null
              },
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
                "alias": "volume24H",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v11/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "priceHigh52W",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v15/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": (v16/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v15/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              }
            ],
            "storageKey": "market(currency:\"USD\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenProject",
            "kind": "LinkedField",
            "name": "project",
            "plural": false,
            "selections": [
              (v17/*: any*/),
              (v18/*: any*/),
              (v19/*: any*/),
              (v20/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Token",
                "kind": "LinkedField",
                "name": "tokens",
                "plural": true,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/)
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
    "name": "TokenQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Token",
        "kind": "LinkedField",
        "name": "tokens",
        "plural": true,
        "selections": [
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          {
            "alias": null,
            "args": (v8/*: any*/),
            "concreteType": "TokenMarket",
            "kind": "LinkedField",
            "name": "market",
            "plural": false,
            "selections": [
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "totalValueLocked",
                "plural": false,
                "selections": (v21/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "price",
                "plural": false,
                "selections": (v21/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume24H",
                "args": (v12/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v21/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "priceHigh52W",
                "args": (v14/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v22/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": (v16/*: any*/),
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v22/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              },
              (v2/*: any*/)
            ],
            "storageKey": "market(currency:\"USD\")"
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "TokenProject",
            "kind": "LinkedField",
            "name": "project",
            "plural": false,
            "selections": [
              (v17/*: any*/),
              (v18/*: any*/),
              (v19/*: any*/),
              (v20/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Token",
                "kind": "LinkedField",
                "name": "tokens",
                "plural": true,
                "selections": [
                  (v5/*: any*/),
                  (v6/*: any*/),
                  (v2/*: any*/)
                ],
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "650ce9b09cdc85375ec02dac7ab527f7",
    "id": null,
    "metadata": {},
    "name": "TokenQuery",
    "operationKind": "query",
    "text": "query TokenQuery(\n  $contract: ContractInput!\n) {\n  tokens(contracts: [$contract]) {\n    id\n    decimals\n    name\n    chain\n    address\n    symbol\n    market(currency: USD) {\n      totalValueLocked {\n        value\n        currency\n        id\n      }\n      price {\n        value\n        currency\n        id\n      }\n      volume24H: volume(duration: DAY) {\n        value\n        currency\n        id\n      }\n      priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {\n        value\n        id\n      }\n      priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {\n        value\n        id\n      }\n      id\n    }\n    project {\n      description\n      homepageUrl\n      twitterName\n      logoUrl\n      tokens {\n        chain\n        address\n        id\n      }\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "781ef6027010d31b55c3da27e7c05778";

export default node;
