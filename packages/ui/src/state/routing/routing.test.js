"use strict";
exports.__esModule = true;
var smart_order_router_1 = require("@teleswap/smart-order-router");
var slice_1 = require("./slice");
var result = (0, slice_1.route)({
    tokenInAddress: '0x5986c8ffadca9cee5c28a85cc3d4f335aab5dc90',
    tokenInChainId: smart_order_router_1.ChainId.OPTIMISTIC_GOERLI,
    tokenInDecimals: 18,
    tokenOutAddress: '0x53b1c6025e3f9b149304cf1b39ee7c577d76c6ca',
    tokenOutChainId: smart_order_router_1.ChainId.OPTIMISTIC_GOERLI,
    tokenOutDecimals: 18,
    amount: '1000000000000000000000',
    type: 'exactIn',
    recipient: '',
    slippageTolerance: '0.05',
    deadline: ''
});
console.log('debug joy', result);
