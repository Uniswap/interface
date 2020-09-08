"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function evalToString(ast) {
    switch (ast.type) {
        case 'StringLiteral':
            return ast.value;
        case 'BinaryExpression': // `+`
            if (ast.operator !== '+') {
                throw new Error('Unsupported binary operator ' + ast.operator);
            }
            return evalToString(ast.left) + evalToString(ast.right);
        default:
            throw new Error('Unsupported type ' + ast.type);
    }
}
exports.evalToString = evalToString;
