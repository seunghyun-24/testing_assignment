import {
  Range,
  getString,
  log,
  warn,
  todo,
  parse,
  createExpr,
  createSeqExpr,
  createStmt,
  createBlockStmt,
  toBlockStmt,
  createReturnStmt,
  prependStmt,
} from "./helper";

import dedent from "dedent-js";

import acorn from "acorn";
import {
  Node,
  Function,
  Statement,
  BlockStatement,
  LogicalExpression,
  VariableDeclaration,
  AssignmentPattern,
  SwitchStatement,
  IfStatement,
  ConditionalExpression,
  Expression,
} from "acorn";
import walk from "acorn-walk";

import { generate } from "escodegen";
import { create } from "domain";

// Coverage target
interface CoverageTarget {
  [key: number]: Range;
}

// Covered set
export class CoverSet {
  covered: Set<number>;
  target: CoverageTarget;
  total: number;

  constructor(target: CoverageTarget) {
    this.covered = new Set();
    this.target = target;
    this.total = Object.keys(target).length;
  }

  // Add a covered id
  add = (id: number): void => {
    this.covered.add(id);
  };

  // Conversion to string
  toString = (
    showDetail: boolean = false,
    code: string | undefined = undefined
  ): string => {
    const { covered, target, total } = this;
    const { size } = covered;
    const ratio = (size / total) * 100;
    const ids = Object.keys(target).map(Number);
    const sorted = Array.from(ids).sort((a, b) => a - b);
    let str = `${size}/${total} (${ratio.toFixed(2)}%)`;
    if (showDetail) {
      for (const id of sorted) {
        str += "\n" + "      " + (covered.has(id) ? "*" : " ");
        const range = target[id];
        str += ` ${id}: ${target[id]}`;
        if (code) {
          const { start, end } = range;
          str += " -- " + code.substring(start.index, end.index);
        }
      }
    }
    return `${str}`;
  };
}

// Coverage of the code by statement and branch
export class Coverage {
  code: string;
  modified: string;
  runner?: () => void;
  func: CoverSet;
  stmt: CoverSet;
  branch: CoverSet;

  constructor(code: string) {
    // Parse the code
    let ast = parse(code);

    // Counters for functions, statements, and branches
    let fcount = 0,
      scount = 0,
      bcount = 0;

    // Coverage targets
    let funcTarget: CoverageTarget = {};
    let stmtTarget: CoverageTarget = {};
    let branchTarget: CoverageTarget = {};

    // Recursive visitor for the AST
    const visitor: walk.RecursiveVisitors<any> = {
      Function(func) {
        const { id, params, body } = func;
        for (const param of params) {
          walk.recursive(param, null, visitor);
        }
        const fid = fcount++;
        funcTarget[fid] = Range.fromNode(code, func);
        const countStmt = createStmt(`__cov__.func.add(${fid});`);
        if (body.type === "BlockStatement") {
          const blockStmt = body as BlockStatement;
          const stmts = blockStmt.body;
          blockStmt.body = walkStmts(stmts);
          blockStmt.body.unshift(countStmt);
        } else {
          const returnStmt = createReturnStmt(body);
          const a = createBlockStmt([returnStmt]);
          a.body = walkStmts(a.body);
          a.body.unshift(countStmt);
          func.body = a;
          func.expression = false;
        }
      },
      VariableDeclaration(decl) {
        //todo("VariableDeclaration");
        const { declarations } = decl;

        for (const decl of declarations) {
          const { id, init } = decl;
          walk.recursive(id, null, visitor);

          if (init) {
            const sid = scount++;
            stmtTarget[sid] = Range.fromNode(code, decl);
            const exp = createExpr(`__cov__.stmt.add(${sid})`);
            decl.init = createSeqExpr([exp, init]);
            walk.recursive(init, null, visitor);
          }
        }
      },
      AssignmentPattern(pattern) {
        //todo("AssignmentPattern");
        const { left, right } = pattern;

        walk.recursive(left, null, visitor);
        const sid = scount++;
        stmtTarget[sid] = Range.fromNode(code, right);
        const exp = createExpr(`__cov__.stmt.add(${sid})`);
        pattern.right = createSeqExpr([exp, right]);
        walk.recursive(right, null, visitor);
      },
      BlockStatement(node) {
        node.body = walkStmts(node.body);
      },
      SwitchStatement(stmt) {
        //todo("SwitchStatement");
        const { cases } = stmt;

        walk.recursive(stmt.discriminant, null, visitor);
        for (const c of cases) {
          const bid = bcount++;
          branchTarget[bid] = Range.fromNode(code, c);
          const branchStmt = createStmt(`__cov__.branch.add(${bid});`);

          c.consequent = walkStmts(c.consequent);
          c.consequent.unshift(branchStmt);
        }
      },
      StaticBlock(node) {
        //todo("StaticBlock");
        const { body } = node;
        node.body = walkStmts(body);
      },
      IfStatement(stmt) {
        //todo("IfStatement");
        const { test, consequent, alternate } = stmt;

        walk.recursive(test, null, visitor);

        const bid = bcount++;
        branchTarget[bid] = Range.fromNode(code, stmt);
        const branchStmt = createStmt(`__cov__.branch.add(${bid});`);

        if (consequent.type === "BlockStatement") {
          const stmts = consequent.body;
          consequent.body = walkStmts(stmts);
          consequent.body.unshift(branchStmt);
        } else {
          const a = createBlockStmt([consequent]);
          a.body = walkStmts(a.body);
          a.body.unshift(branchStmt);
          stmt.consequent = a;
        }

        if (alternate) {
          const bid = bcount++;
          branchTarget[bid] = Range.fromNode(code, stmt);
          const branchStmt = createStmt(`__cov__.branch.add(${bid});`);

          if (alternate.type === "BlockStatement") {
            const stmts = alternate.body;
            alternate.body = walkStmts(stmts);
            alternate.body.unshift(branchStmt);
          } else {
            const a = createBlockStmt([alternate]);
            a.body = walkStmts(a.body);
            a.body.unshift(branchStmt);
            stmt.alternate = a;
          }
        } else {
          const bid = bcount++;
          branchTarget[bid] = Range.fromNode(code, stmt);
          const branchStmt = createStmt(`__cov__.branch.add(${bid});`);
          stmt.alternate = createBlockStmt([branchStmt]);
        }
      },
      ConditionalExpression(expr) {
        //todo("ConditionalExpression");
        const { test, consequent, alternate } = expr;
        walk.recursive(test, null, visitor);

        const bid = bcount++;
        branchTarget[bid] = Range.fromNode(code, expr);
        const exp = createExpr(`__cov__.branch.add(${bid})`);
        expr.consequent = createSeqExpr([exp, consequent]);
        walk.recursive(consequent, null, visitor);

        const _bid = bcount++;
        branchTarget[_bid] = Range.fromNode(code, expr);
        const _exp = createExpr(`__cov__.branch.add(${_bid})`);
        expr.alternate = createSeqExpr([_exp, alternate]);
        walk.recursive(alternate, null, visitor);
      },
      LogicalExpression(node) {
        //todo("LogicalExpression");
        const { left, right } = node;

        if (left.type === "LogicalExpression") {
          walk.recursive(left, null, visitor);
        } else {
          const bid = bcount++;
          branchTarget[bid] = Range.fromNode(code, left);
          const exp = createExpr(`__cov__.branch.add(${bid})`);
          node.left = createSeqExpr([exp, left]);
          walk.recursive(left, null, visitor);
        }

        if (right.type === "LogicalExpression") {
          walk.recursive(right, null, visitor);
        } else {
          const _bid = bcount++;
          branchTarget[_bid] = Range.fromNode(code, right);
          const _exp = createExpr(`__cov__.branch.add(${_bid})`);
          node.right = createSeqExpr([_exp, right]);
          walk.recursive(right, null, visitor);
        }
      },
      LabeledStatement(node) {
        //todo("LabeledStatement");
        const { body } = node;

        if (body.type === "BlockStatement") {
          const stmts = body.body;
          body.body = walkStmts(stmts);
        } else {
          const a = createBlockStmt([body]);
          a.body = walkStmts(a.body);
          node.body = a;
        }
      },
      WhileStatement(node) {
        //todo("WhileStatement");
        const { test, body } = node;
        walk.recursive(test, null, visitor);
        if (body.type === "BlockStatement") {
          const stmts = body.body;
          body.body = walkStmts(stmts);
        } else {
          const a = createBlockStmt([body]);
          a.body = walkStmts(a.body);
          node.body = a;
        }
      },
      DoWhileStatement(node) {
        //todo("DoWhileStatement");
        const { test, body } = node;
        walk.recursive(test, null, visitor);
        if (body.type === "BlockStatement") {
          const stmts = body.body;
          body.body = walkStmts(stmts);
        } else {
          const a = createBlockStmt([body]);
          a.body = walkStmts(a.body);
          node.body = a;
        }
      },
      ForStatement(node) {
        //todo("ForStatement");
        const { init, test, update, body } = node;
        if (init) walk.recursive(init, null, visitor);
        if (test) walk.recursive(test, null, visitor);
        if (update) walk.recursive(update, null, visitor);

        if (body.type === "BlockStatement") {
          const stmts = body.body;
          body.body = walkStmts(stmts);
        } else {
          const a = createBlockStmt([body]);
          a.body = walkStmts(a.body);
          node.body = a;
        }
      },
      ForInStatement(node) {
        //todo("ForInStatement");
        const { left, right, body } = node;
        walk.recursive(right, null, visitor);
        if (body.type === "BlockStatement") {
          const stmts = body.body;
          body.body = walkStmts(stmts);
        } else {
          const a = createBlockStmt([body]);
          a.body = walkStmts(a.body);
          node.body = a;
        }
      },
      ForOfStatement(node) {
        //todo("ForOfStatement");
        const { left, right, body } = node;
        walk.recursive(right, null, visitor);
        if (body.type === "BlockStatement") {
          const stmts = body.body;
          body.body = walkStmts(stmts);
        } else {
          const a = createBlockStmt([body]);
          a.body = walkStmts(a.body);
          node.body = a;
        }
      },
    };

    // Instrument the sequence of statements
    function walkStmts(stmts: Statement[]): Statement[] {
      let newStmts = [];
      for (const stmt of stmts) {
        if (!stmt.type.endsWith("Declaration")) {
          const sid = scount++;
          stmtTarget[sid] = Range.fromNode(code, stmt);
          newStmts.push(createStmt(`__cov__.stmt.add(${sid});`));
        }
        newStmts.push(stmt);
        walk.recursive(stmt, null, visitor);
      }
      return newStmts;
    }

    // Recursively visit the AST
    walk.recursive(ast, null, visitor);

    // Fill the fields of the coverage object
    this.code = code;
    this.modified = generate(ast);
    this.func = new CoverSet(funcTarget);
    this.stmt = new CoverSet(stmtTarget);
    this.branch = new CoverSet(branchTarget);
    try {
      this.runner = eval(`(() => {
        const __cov__ = this;
        const orig = ${this.modified};
        function func() {
          try { return orig.apply(null, arguments); } catch (e) { }
        };
        return func;
      })();`);
    } catch (_) {
      warn("The given code is not runnable with arguments.");
    }
  }

  // Run the instrumented code with the inputs
  run = (inputs: any[]): void => {
    for (const input of inputs) this.runSingle(input);
  };

  // Run the instrumented code with a single input
  runSingle = (input: any): void => {
    if (this.runner) this.runner.apply(null, input);
    else warn("The given code is not runnable with arguments.");
  };

  // Conversion to string
  toString = (
    showModified: boolean = false,
    showDetail: boolean = false
  ): string => {
    const { code, func: f, stmt: s, branch: b } = this;
    let str: string = "";
    if (showModified) str += `Modified: ${this.modified}\n`;
    str += `Coverage:` + "\n";
    if (f.total > 0) str += `- func: ${f.toString(showDetail)}\n`;
    if (s.total > 0) str += `- stmt: ${s.toString(showDetail)}\n`;
    if (b.total > 0) str += `- branch: ${b.toString(showDetail)}\n`;
    return str.trim();
  };
}
