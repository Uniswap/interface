/**
 * @generated SignedSource<<19f422181fe95395e3fb68bd58550e28>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { Fragment, ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type Token_TokenProject_Metadata$data = {
  readonly description: string | null;
  readonly homepageUrl: string | null;
  readonly name: string | null;
  readonly twitterName: string | null;
  readonly " $fragmentType": "Token_TokenProject_Metadata";
};
export type Token_TokenProject_Metadata$key = {
  readonly " $data"?: Token_TokenProject_Metadata$data;
  readonly " $fragmentSpreads": FragmentRefs<"Token_TokenProject_Metadata">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "Token_TokenProject_Metadata",
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
    }
  ],
  "type": "TokenProject",
  "abstractKey": null
};

(node as any).hash = "8a230bb0aea4235e503b33316895fd3f";

export default node;
