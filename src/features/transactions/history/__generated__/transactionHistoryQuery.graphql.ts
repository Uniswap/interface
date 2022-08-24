/**
 * @generated SignedSource<<09fbe0b0b123240b527f952051fe417a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest, Query } from 'relay-runtime';
export type ActivityType = "APPROVE" | "BORROW" | "BURN" | "CANCEL" | "CLAIM" | "DEPLOYMENT" | "LEND" | "MINT" | "NFT" | "RECEIVE" | "REPAY" | "SEND" | "STAKE" | "SWAP" | "Staking" | "UNKNOWN" | "UNSTAKE" | "WITHDRAW" | "market" | "money" | "%future added value";
export type Chain = "ARBITRUM" | "ETHEREUM" | "ETHEREUM_GOERLI" | "OPTIMISM" | "POLYGON" | "%future added value";
export type Currency = "ETH" | "USD" | "%future added value";
export type NftStandard = "ERC1155" | "ERC721" | "NONCOMPLIANT" | "%future added value";
export type TokenStandard = "ERC1155" | "ERC20" | "NATIVE" | "%future added value";
export type TransactionDirection = "IN" | "OUT" | "SELF" | "%future added value";
export type TransactionStatus = "CONFIRMED" | "FAILED" | "PENDING" | "%future added value";
export type transactionHistoryQuery$variables = {
  address: string;
  page?: number | null;
  ps?: number | null;
};
export type transactionHistoryQuery$data = {
  readonly assetActivities: ReadonlyArray<{
    readonly assetChanges: ReadonlyArray<{
      readonly __typename: "NftTransfer";
      readonly asset: {
        readonly collection: {
          readonly name: string | null;
        } | null;
        readonly imageUrl: string | null;
        readonly name: string | null;
        readonly nftContract: {
          readonly address: string | null;
          readonly chain: Chain;
        } | null;
        readonly tokenId: string | null;
      };
      readonly direction: TransactionDirection;
      readonly nftStandard: NftStandard;
      readonly recipient: string;
      readonly sender: string;
    } | {
      readonly __typename: "TokenApproval";
      readonly approvedAddress: string;
      readonly asset: {
        readonly address: string | null;
        readonly chain: Chain;
        readonly decimals: number | null;
        readonly name: string | null;
        readonly symbol: string | null;
      };
      readonly quantity: string;
      readonly tokenStandard: TokenStandard;
    } | {
      readonly __typename: "TokenTransfer";
      readonly asset: {
        readonly address: string | null;
        readonly chain: Chain;
        readonly decimals: number | null;
        readonly name: string | null;
        readonly symbol: string | null;
      };
      readonly direction: TransactionDirection;
      readonly quantity: string;
      readonly recipient: string;
      readonly sender: string;
      readonly tokenStandard: TokenStandard;
      readonly transactedValue: {
        readonly currency: Currency | null;
        readonly value: number | null;
      } | null;
    } | {
      // This will never be '%other', but we need some
      // value in case none of the concrete values match.
      readonly __typename: "%other";
    } | null>;
    readonly timestamp: number;
    readonly transaction: {
      readonly from: string;
      readonly hash: string;
      readonly status: TransactionStatus;
      readonly to: string;
    };
    readonly type: ActivityType;
  } | null> | null;
};
export type transactionHistoryQuery = {
  response: transactionHistoryQuery$data;
  variables: transactionHistoryQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "address"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "page"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "ps"
},
v3 = [
  {
    "kind": "Variable",
    "name": "address",
    "variableName": "address"
  },
  {
    "kind": "Variable",
    "name": "page",
    "variableName": "page"
  },
  {
    "kind": "Variable",
    "name": "pageSize",
    "variableName": "ps"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "timestamp",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "type",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "hash",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "to",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "from",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "__typename",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "symbol",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "address",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "decimals",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "chain",
  "storageKey": null
},
v16 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenStandard",
  "storageKey": null
},
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "quantity",
  "storageKey": null
},
v18 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "sender",
  "storageKey": null
},
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "recipient",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "direction",
  "storageKey": null
},
v21 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currency",
  "storageKey": null
},
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "value",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "tokenId",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "imageUrl",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "nftStandard",
  "storageKey": null
},
v26 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "approvedAddress",
  "storageKey": null
},
v27 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v28 = [
  (v27/*: any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*: any*/),
      (v1/*: any*/),
      (v2/*: any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "transactionHistoryQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "AssetActivity",
        "kind": "LinkedField",
        "name": "assetActivities",
        "plural": true,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Transaction",
            "kind": "LinkedField",
            "name": "transaction",
            "plural": false,
            "selections": [
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
            "concreteType": null,
            "kind": "LinkedField",
            "name": "assetChanges",
            "plural": true,
            "selections": [
              (v10/*: any*/),
              {
                "kind": "InlineFragment",
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Token",
                    "kind": "LinkedField",
                    "name": "asset",
                    "plural": false,
                    "selections": [
                      (v11/*: any*/),
                      (v12/*: any*/),
                      (v13/*: any*/),
                      (v14/*: any*/),
                      (v15/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "transactedValue",
                    "plural": false,
                    "selections": [
                      (v21/*: any*/),
                      (v22/*: any*/)
                    ],
                    "storageKey": null
                  }
                ],
                "type": "TokenTransfer",
                "abstractKey": null
              },
              {
                "kind": "InlineFragment",
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftAsset",
                    "kind": "LinkedField",
                    "name": "asset",
                    "plural": false,
                    "selections": [
                      (v11/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftContract",
                        "kind": "LinkedField",
                        "name": "nftContract",
                        "plural": false,
                        "selections": [
                          (v15/*: any*/),
                          (v13/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v23/*: any*/),
                      (v24/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftCollection",
                        "kind": "LinkedField",
                        "name": "collection",
                        "plural": false,
                        "selections": [
                          (v11/*: any*/)
                        ],
                        "storageKey": null
                      }
                    ],
                    "storageKey": null
                  },
                  (v25/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/)
                ],
                "type": "NftTransfer",
                "abstractKey": null
              },
              {
                "kind": "InlineFragment",
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Token",
                    "kind": "LinkedField",
                    "name": "asset",
                    "plural": false,
                    "selections": [
                      (v11/*: any*/),
                      (v12/*: any*/),
                      (v14/*: any*/),
                      (v13/*: any*/),
                      (v15/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v16/*: any*/),
                  (v26/*: any*/),
                  (v17/*: any*/)
                ],
                "type": "TokenApproval",
                "abstractKey": null
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
    "argumentDefinitions": [
      (v0/*: any*/),
      (v2/*: any*/),
      (v1/*: any*/)
    ],
    "kind": "Operation",
    "name": "transactionHistoryQuery",
    "selections": [
      {
        "alias": null,
        "args": (v3/*: any*/),
        "concreteType": "AssetActivity",
        "kind": "LinkedField",
        "name": "assetActivities",
        "plural": true,
        "selections": [
          (v4/*: any*/),
          (v5/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "Transaction",
            "kind": "LinkedField",
            "name": "transaction",
            "plural": false,
            "selections": [
              (v6/*: any*/),
              (v7/*: any*/),
              (v8/*: any*/),
              (v9/*: any*/),
              (v27/*: any*/)
            ],
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": null,
            "kind": "LinkedField",
            "name": "assetChanges",
            "plural": true,
            "selections": [
              (v10/*: any*/),
              {
                "kind": "InlineFragment",
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Token",
                    "kind": "LinkedField",
                    "name": "asset",
                    "plural": false,
                    "selections": [
                      (v11/*: any*/),
                      (v12/*: any*/),
                      (v13/*: any*/),
                      (v14/*: any*/),
                      (v15/*: any*/),
                      (v27/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v16/*: any*/),
                  (v17/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Amount",
                    "kind": "LinkedField",
                    "name": "transactedValue",
                    "plural": false,
                    "selections": [
                      (v21/*: any*/),
                      (v22/*: any*/),
                      (v27/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v27/*: any*/)
                ],
                "type": "TokenTransfer",
                "abstractKey": null
              },
              {
                "kind": "InlineFragment",
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "NftAsset",
                    "kind": "LinkedField",
                    "name": "asset",
                    "plural": false,
                    "selections": [
                      (v11/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftContract",
                        "kind": "LinkedField",
                        "name": "nftContract",
                        "plural": false,
                        "selections": [
                          (v15/*: any*/),
                          (v13/*: any*/),
                          (v27/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v23/*: any*/),
                      (v24/*: any*/),
                      {
                        "alias": null,
                        "args": null,
                        "concreteType": "NftCollection",
                        "kind": "LinkedField",
                        "name": "collection",
                        "plural": false,
                        "selections": [
                          (v11/*: any*/),
                          (v27/*: any*/)
                        ],
                        "storageKey": null
                      },
                      (v27/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v25/*: any*/),
                  (v18/*: any*/),
                  (v19/*: any*/),
                  (v20/*: any*/),
                  (v27/*: any*/)
                ],
                "type": "NftTransfer",
                "abstractKey": null
              },
              {
                "kind": "InlineFragment",
                "selections": [
                  {
                    "alias": null,
                    "args": null,
                    "concreteType": "Token",
                    "kind": "LinkedField",
                    "name": "asset",
                    "plural": false,
                    "selections": [
                      (v11/*: any*/),
                      (v12/*: any*/),
                      (v14/*: any*/),
                      (v13/*: any*/),
                      (v15/*: any*/),
                      (v27/*: any*/)
                    ],
                    "storageKey": null
                  },
                  (v16/*: any*/),
                  (v26/*: any*/),
                  (v17/*: any*/),
                  (v27/*: any*/)
                ],
                "type": "TokenApproval",
                "abstractKey": null
              },
              {
                "kind": "InlineFragment",
                "selections": (v28/*: any*/),
                "type": "NftApproval",
                "abstractKey": null
              },
              {
                "kind": "InlineFragment",
                "selections": (v28/*: any*/),
                "type": "NftApproveForAll",
                "abstractKey": null
              }
            ],
            "storageKey": null
          },
          (v27/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "0a94fc6c2db51d3758aed561408443ba",
    "id": null,
    "metadata": {},
    "name": "transactionHistoryQuery",
    "operationKind": "query",
    "text": "query transactionHistoryQuery(\n  $address: String!\n  $ps: Int\n  $page: Int\n) {\n  assetActivities(address: $address, pageSize: $ps, page: $page) {\n    timestamp\n    type\n    transaction {\n      hash\n      status\n      to\n      from\n      id\n    }\n    assetChanges {\n      __typename\n      ... on TokenTransfer {\n        asset {\n          name\n          symbol\n          address\n          decimals\n          chain\n          id\n        }\n        tokenStandard\n        quantity\n        sender\n        recipient\n        direction\n        transactedValue {\n          currency\n          value\n          id\n        }\n        id\n      }\n      ... on NftTransfer {\n        asset {\n          name\n          nftContract {\n            chain\n            address\n            id\n          }\n          tokenId\n          imageUrl\n          collection {\n            name\n            id\n          }\n          id\n        }\n        nftStandard\n        sender\n        recipient\n        direction\n        id\n      }\n      ... on TokenApproval {\n        asset {\n          name\n          symbol\n          decimals\n          address\n          chain\n          id\n        }\n        tokenStandard\n        approvedAddress\n        quantity\n        id\n      }\n      ... on NftApproval {\n        id\n      }\n      ... on NftApproveForAll {\n        id\n      }\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "56785db6b51f69d18c0a10b9dedd3caa";

export default node;
