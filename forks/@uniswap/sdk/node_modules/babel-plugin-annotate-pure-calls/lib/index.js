"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const PURE_ANNOTATION = '#__PURE__';

const isPureAnnotated = node => {
  const leadingComments = node.leadingComments;

  if (!leadingComments) {
    return false;
  }

  return leadingComments.some(comment => /[@#]__PURE__/.test(comment.value));
};

const annotateAsPure = path => {
  if (isPureAnnotated(path.node)) {
    return;
  }

  path.addComment('leading', PURE_ANNOTATION);
};

const hasCallableParent = ({
  parentPath
}) => parentPath.isCallExpression() || parentPath.isNewExpression();

const isUsedAsCallee = path => {
  if (!hasCallableParent(path)) {
    return false;
  }

  return path.parentPath.get('callee') === path;
};

const isInCallee = path => {
  do {
    path = path.parentPath;

    if (isUsedAsCallee(path)) {
      return true;
    }
  } while (!path.isStatement() && !path.isFunction());

  return false;
};

const isExecutedDuringInitialization = path => {
  let functionParent = path.getFunctionParent();

  while (functionParent) {
    // babel@6 returns "incorrectly" program as function parent
    if (functionParent.isProgram()) {
      return true;
    }

    if (!isUsedAsCallee(functionParent)) {
      return false;
    }

    functionParent = functionParent.getFunctionParent();
  }

  return true;
};

const isInAssignmentContext = path => {
  const statement = path.getStatementParent();
  let parentPath;

  do {
    ;

    var _ref = parentPath || path;

    parentPath = _ref.parentPath;

    if (parentPath.isVariableDeclaration() || parentPath.isAssignmentExpression()) {
      return true;
    }
  } while (parentPath !== statement);

  return false;
};

const callableExpressionVisitor = path => {
  if (isUsedAsCallee(path) || isInCallee(path)) {
    return;
  }

  if (!isExecutedDuringInitialization(path)) {
    return;
  }

  if (!isInAssignmentContext(path) && !path.getStatementParent().isExportDefaultDeclaration()) {
    return;
  }

  annotateAsPure(path);
};

var _default = () => ({
  name: 'annotate-pure-calls',
  visitor: {
    'CallExpression|NewExpression': callableExpressionVisitor
  }
});

exports.default = _default;