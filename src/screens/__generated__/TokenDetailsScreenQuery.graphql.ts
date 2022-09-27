/**
 * @generated SignedSource<<458d6c4464042035b8ab8ea230a9ce42>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type Chain = "ARBITRUM" | "CELO" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type ContractInput = {
  address?: string | null;
  chain: Chain;
};
export type TokenDetailsScreenQuery$variables = {
  contract: ContractInput;
};
export type TokenDetailsScreenQuery$data = {
  readonly tokenProjects: ReadonlyArray<{
    readonly " $fragmentSpreads": FragmentRefs<"TokenDetailsScreen_headerPriceLabel" | "TokenDetailsStats_tokenProject">;
  } | null> | null;
};
export type TokenDetailsScreenQuery = {
  response: TokenDetailsScreenQuery$data;
  variables: TokenDetailsScreenQuery$variables;
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
v3 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "value",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "currency",
    "storageKey": null
  },
  (v2/*: any*/)
],
v4 = {
  "kind": "Literal",
  "name": "duration",
  "value": "YEAR"
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "TokenDetailsScreenQuery",
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
            "args": null,
            "kind": "FragmentSpread",
            "name": "TokenDetailsStats_tokenProject"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "TokenDetailsScreen_headerPriceLabel"
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
    "name": "TokenDetailsScreenQuery",
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
            "kind": "ScalarField",
            "name": "description",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "homepageUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "twitterName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "name",
            "storageKey": null
          },
          {
            "alias": null,
            "args": [
              {
                "kind": "Literal",
                "name": "currencies",
                "value": [
                  "USD"
                ]
              }
            ],
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
                "selections": (v3/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "marketCap",
                "plural": false,
                "selections": (v3/*: any*/),
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "fullyDilutedMarketCap",
                "plural": false,
                "selections": (v3/*: any*/),
                "storageKey": null
              },
              {
                "alias": "volume24h",
                "args": [
                  {
                    "kind": "Literal",
                    "name": "duration",
                    "value": "DAY"
                  }
                ],
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "volume",
                "plural": false,
                "selections": (v3/*: any*/),
                "storageKey": "volume(duration:\"DAY\")"
              },
              {
                "alias": "priceHigh52W",
                "args": [
                  (v4/*: any*/),
                  {
                    "kind": "Literal",
                    "name": "highLow",
                    "value": "HIGH"
                  }
                ],
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v3/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"HIGH\")"
              },
              {
                "alias": "priceLow52W",
                "args": [
                  (v4/*: any*/),
                  {
                    "kind": "Literal",
                    "name": "highLow",
                    "value": "LOW"
                  }
                ],
                "concreteType": "Amount",
                "kind": "LinkedField",
                "name": "priceHighLow",
                "plural": false,
                "selections": (v3/*: any*/),
                "storageKey": "priceHighLow(duration:\"YEAR\",highLow:\"LOW\")"
              },
              (v2/*: any*/)
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
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "chain",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "address",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "symbol",
                "storageKey": null
              },
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "decimals",
                "storageKey": null
              },
              (v2/*: any*/)
            ],
            "storageKey": null
          },
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "2ccd47cdf54f2051be73fb25c1bc4265",
    "id": null,
    "metadata": {},
    "name": "TokenDetailsScreenQuery",
    "operationKind": "query",
    "text": "query TokenDetailsScreenQuery(\n  $contract: ContractInput!\n) {\n  tokenProjects(contracts: [$contract]) {\n    ...TokenDetailsStats_tokenProject\n    ...TokenDetailsScreen_headerPriceLabel\n    id\n  }\n}\n\nfragment TokenDetailsScreen_headerPriceLabel on TokenProject {\n  markets(currencies: [USD]) {\n    price {\n      value\n      id\n    }\n    id\n  }\n}\n\nfragment TokenDetailsStats_tokenProject on TokenProject {\n  description\n  homepageUrl\n  twitterName\n  name\n  markets(currencies: [USD]) {\n    price {\n      value\n      currency\n      id\n    }\n    marketCap {\n      value\n      currency\n      id\n    }\n    fullyDilutedMarketCap {\n      value\n      currency\n      id\n    }\n    volume24h: volume(duration: DAY) {\n      value\n      currency\n      id\n    }\n    priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {\n      value\n      currency\n      id\n    }\n    priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {\n      value\n      currency\n      id\n    }\n    id\n  }\n  tokens {\n    chain\n    address\n    symbol\n    decimals\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "256a81dcaa452a0633d7c5a22a37121e";

export default node;
