import {
  log,
  header,
  warn,
  todo,
  parse,
  Range,
  createBoolLiteral,
  createTemplateElement,
} from "./helper";

import { Mutant, MutantType } from "./tester";

import { green } from "chalk";

import acorn from "acorn";
import {
  AssignmentOperator,
  BinaryExpression,
  BinaryOperator,
  BlockStatement,
  ConditionalExpression,
  Expression,
  IfStatement,
  LogicalExpression,
  LogicalOperator,
  Node,
} from "acorn";

import walk, { full, recursive } from "acorn-walk";

import { generate } from "astring";

function deepCopy(obj: any) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  const copy: { [key: string]: any } = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key]);
    }
  }
  return copy;
}

// function processVectorPrototype(node: any) {
//   if (node.type === 'AssignmentExpression' &&
//       node.left.type === 'MemberExpression' &&
//       node.left.object.name === 'Vector' &&
//       node.left.property.name === 'prototype' &&
//       node.right.type === 'ObjectExpression') {
//     console.log('Found Vector.prototype assignment');
//     // Further process the methods
//     node.right.properties.forEach((property: any) => { // Explicitly type 'property' as 'any'
//       console.log(`Method name: ${property.key.name}`);
//       // Process the method's function expression
//     });
//   }
// }

/* Mutator
 *
 * (Problem #1) Mutation Operation (70 points)
 *
 * Please implement the missing parts (denoted by todo() functions).
 *
 * The goal of this project to generate mutants from a given JavaScript code
 * and to measure the mutation score of a test suite as its adequacy criterion.
 */
export class Mutator {
  code: string;
  mutants: Mutant[];
  ast: Node;
  beautified: string;
  detail: boolean;

  // Generate mutants from the code
  static from(code: string, detail: boolean = false): Mutant[] {
    const mutator = new Mutator(code, detail);
    return mutator.mutants;
  }

  // Constructor
  constructor(code: string, detail: boolean = false) {
    this.code = code;
    this.mutants = [];
    this.ast = parse(this.code);
    this.beautified = generate(this.ast);
    this.detail = detail;
    this.generateMutants();
  }

  // Generate mutants
  generateMutants = (): void => {
    const { ast, beautified: before, visitor, detail } = this;
    if (detail) header("Generating Mutants...");
    walk.recursive(ast, null, visitor);
    const after = generate(ast);
    if (before !== after) {
      warn("The AST is changed after generating mutants");
    }
  };

  // Add a mutant to the list with its type and the target node
  addMutant = (type: MutantType, node: Node): void => {
    const { mutants, code, ast, beautified, detail } = this;
    const id = mutants.length + 1;
    const mutated = generate(ast);
    const range = Range.fromNode(code, node);
    const after = generate(node);
    const mutant = new Mutant(id, type, mutated, code, range, after);
    mutants.push(mutant);
    if (beautified == mutated) {
      //warn('The code is the same after generating a mutant');
      //warn(mutant);
    } else if (detail) {
      log(mutant, green);
    }
  };

  // Visitor for generating mutants
  visitor: walk.RecursiveVisitors<any> = {
    ArrayExpression: (node) => {
      const { visitor, addMutant } = this;
      const { elements } = node;

      if (elements.length > 0 && elements) {
        //length로 처리해야 빈거 자꾸 안함.
        node.elements = [];
        addMutant(MutantType.ArrayDecl, node);
        node.elements = elements;
        for (const elem of elements) {
          if (elem) walk.recursive(elem, null, visitor);
        }
      }
      //else return;
    },
    AssignmentExpression: (node) => {
      const { visitor, addMutant } = this;
      const { left, right, operator } = node;

      if (operator === "=") {
        walk.recursive(left, null, visitor);
        walk.recursive(right, null, visitor);
        return;
      }
      switch (operator) {
        case "+=":
          node.operator = "-=";
          break;
        case "-=":
          node.operator = "+=";
          break;
        case "*=":
          node.operator = "/=";
          break;
        case "/=":
          node.operator = "*=";
          break;
        case "%=":
          node.operator = "*=";
          break;
        case "<<=":
          node.operator = ">>=";
          break;
        case ">>=":
          node.operator = "<<=";
          break;
        case "&=":
          node.operator = "|=";
          break;
        case "|=":
          node.operator = "&=";
          break;
        case "??=":
          node.operator = "&&=";
          break;
      }
      addMutant(MutantType.AssignExpr, node);
      node.operator = operator;
      walk.recursive(left, null, visitor);
      walk.recursive(right, null, visitor);
    },
    BinaryExpression: (node) => {
      const { visitor, addMutant } = this;
      const { left, right, operator } = node;

      //need to check here!

      switch (operator) {
        case "+":
          node.operator = "-";
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case "-":
          node.operator = "+";
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case "*":
          node.operator = "/";
          addMutant(MutantType.Arithmetic, node);
          node.operator = "%";
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case "/":
          node.operator = "*";
          addMutant(MutantType.Arithmetic, node);
          node.operator = "%";
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case "%":
          node.operator = "*";
          addMutant(MutantType.Arithmetic, node);
          node.operator = "/";
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
      }

      switch (operator) {
        case ">":
          node.operator = ">=";
          addMutant(MutantType.EqualityOp, node);
          node.operator = "<=";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case ">=":
          node.operator = ">";
          addMutant(MutantType.EqualityOp, node);
          node.operator = "<";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case "<":
          node.operator = "<=";
          addMutant(MutantType.EqualityOp, node);
          node.operator = ">=";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case "<=":
          node.operator = "<";
          addMutant(MutantType.EqualityOp, node);
          node.operator = ">";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
      }

      switch (operator) {
        case "==":
          node.operator = "!=";
          addMutant(MutantType.EqualityOp, node);
          node.operator;

          if (left.type === "Literal" && left.value === null) break;
          if (right.type === "Literal" && right.value === null) break;

          node.operator = "===";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case "!=":
          node.operator = "==";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;

          if (left.type === "Literal" && left.value === null) break;
          if (right.type === "Literal" && right.value === null) break;

          node.operator = "!==";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case "===":
          node.operator = "!==";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;

          if (left.type === "Literal" && left.value === null) break;
          if (right.type === "Literal" && right.value === null) break;

          node.operator = "==";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case "!==":
          node.operator = "===";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;

          if (left.type === "Literal" && left.value === null) break;
          if (right.type === "Literal" && right.value === null) break;

          node.operator = "!=";
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
      }

      walk.recursive(left, null, visitor);
      walk.recursive(right, null, visitor);
    },
    BlockStatement: (node) => {
      const { visitor } = this;
      const body = node.body;

      //if(body.length === 0) return; //block.js의 else {} 경우를 mutate하지 않기 위해 추가해줌.
      if (body.length != 0) {
        node.body = [];
        this.addMutant(MutantType.BlockStmt, node);
        node.body = body;
        for (const stmt of body) {
          //console.log(stmt)
          walk.recursive(stmt, null, visitor);
        }
      }
      // else return;
    },
    ChainExpression: (node) => {
      const { visitor, addMutant } = this;
      const { expression } = node;
      const save = deepCopy(node);

      walk.ancestor(node, {
        Identifier(node, state, ancestors) {
          ancestors.map((n) => {
            if (n.type === "MemberExpression") {
              if ("optional" in n) {
                n.optional = false;
              }
            } else if (n.type === "CallExpression") {
              if ("optional" in n) {
                n.optional = false;
              }
            }
          });
        },
      });

      //walk.simple(node, vis);
      addMutant(MutantType.OptionalChain, node);
      Object.assign(node, save);
      walk.recursive(expression, null, visitor);
    },
    ConditionalExpression: (node) => {
      const { visitor, addMutant } = this;
      const { test, consequent, alternate } = node;

      if (
        node.test.type === "Literal" &&
        typeof node.test.value === "boolean"
      ) {
        //bool.js보고 하드코딩 해줌
        node.test.raw === "true"
          ? (node.test.raw = "false")
          : (node.test.raw = "true");
        addMutant(MutantType.Cond, node);
        node.test.raw === "true"
          ? (node.test.raw = "false")
          : (node.test.raw = "true");
      } else {
        // 아직 체크 x
        node.test = createBoolLiteral(true);
        addMutant(MutantType.Cond, node);
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      walk.recursive(test, null, visitor);
      walk.recursive(consequent, null, visitor);
      if (alternate) walk.recursive(alternate, null, visitor);
    },
    DoWhileStatement: (node) => {
      const { visitor, addMutant } = this;
      const { test, body } = node;

      if (typeof node.test == "boolean") {
        if (node.test) {
          node.test = createBoolLiteral(!node.test);
          addMutant(MutantType.Cond, node);
          node.test = test;
        } //false는 체크해줄 필요가 없을 듯?
      } else {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      walk.recursive(test, null, visitor);
      walk.recursive(body, null, visitor);
    },
    ForStatement: (node) => {
      const { visitor, addMutant } = this;
      const { init, test, update, body } = node;

      if (typeof node.test == "boolean") {
        if (node.test) {
          node.test = createBoolLiteral(!node.test);
          addMutant(MutantType.Cond, node);
          node.test = test;
        } //false는 체크해줄 필요가 없을 듯?
      } else {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      if (test) walk.recursive(test, null, visitor);
      if (update) walk.recursive(update, null, visitor);
      walk.recursive(body, null, visitor);
    },
    IfStatement: (node) => {
      const { visitor, addMutant } = this;
      const { test, consequent, alternate } = node;

      if (typeof node.test == "boolean") {
        node.test = createBoolLiteral(!node.test);
        addMutant(MutantType.Cond, node);
        node.test = test;
      } else {
        node.test = createBoolLiteral(true);
        addMutant(MutantType.Cond, node);
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }

      walk.recursive(test, null, visitor);
      walk.recursive(consequent, null, visitor);
      if (alternate) walk.recursive(alternate, null, visitor);
    },
    Literal: (node) => {
      const { visitor, addMutant } = this;
      const { value } = node;

      // 아무것도 안해줬는데, array가 통과됨. literal의 value와 raw가 0이던데, 어떤 차이가 있는 지 모르겠다!
      if (typeof value === "boolean") {
        node.raw = createBoolLiteral(!value).raw;
        addMutant(MutantType.BooleanLiteral, node);
        node.raw = createBoolLiteral(value).raw;
      } else if (node.value === "") {
        if (node.raw === '""') {
          node.raw = '"__PLRG__"';
          addMutant(MutantType.StringLiteral, node);
          node.raw = '""';
        } else if (node.raw === "''") {
          node.raw = '"__PLRG__"';
          addMutant(MutantType.StringLiteral, node);
          node.raw = "''";
        }
      } else if (typeof value != "number" && value != null) {
        // 이게 잘 안되나?
        const raw = node.raw;
        node.raw = '""';
        addMutant(MutantType.StringLiteral, node);
        node.raw = raw;
      }
    },
    LogicalExpression: (node) => {
      const { visitor, addMutant } = this;
      const { left, right, operator } = node;

      switch (operator) {
        case "&&":
          node.operator = "||";
          addMutant(MutantType.LogicalOp, node);
          node.operator = "??";
          addMutant(MutantType.LogicalOp, node);
          node.operator = operator;
          break;
        case "||":
          node.operator = "&&";
          addMutant(MutantType.LogicalOp, node);
          node.operator = "??";
          addMutant(MutantType.LogicalOp, node);
          node.operator = operator;
          break;
        case "??":
          node.operator = "&&";
          addMutant(MutantType.LogicalOp, node);
          node.operator = "||";
          addMutant(MutantType.LogicalOp, node);
          node.operator = operator;
          break;
      }
      walk.recursive(left, null, visitor);
      walk.recursive(right, null, visitor);
    },
    NewExpression: (node) => {
      const { visitor, addMutant } = this;
      const { callee, arguments: args } = node;

      walk.recursive(callee, null, visitor);
      if (args != null && args.length > 0) {
        node.arguments = [];
        addMutant(MutantType.ArrayDecl, node);
        for (const arg of args) walk.recursive(arg, null, visitor);
        node.arguments = args;
      }
    },
    ObjectExpression: (node) => {
      const { visitor, addMutant } = this;
      const { properties } = node;

      if (properties.length > 0) {
        node.properties = [];
        addMutant(MutantType.ObjectLiteral, node);
        node.properties = properties;
      } else {
        // need checking?
        return;
      }
      for (const property of properties) {
        walk.recursive(property, null, visitor);
      }
    },
    TemplateLiteral: (node) => {
      const { visitor, addMutant } = this;
      const { quasis, expressions } = node;
      const save = deepCopy(quasis);

      if (quasis.length === 1) {
        const quasi = quasis[0];
        const idx = quasis.indexOf(quasi);
        const body = quasis;

        if (quasi.value.raw === "") {
          node.quasis[idx] = createTemplateElement("__PLRG__");
          addMutant(MutantType.StringLiteral, node);
          node.quasis[idx] = quasi;
        } else {
          node.quasis[idx] = createTemplateElement("");
          addMutant(MutantType.StringLiteral, node);
          node.quasis[idx] = quasi;
          walk.recursive(quasi, null, visitor);
        }
      } else {
        for (const quasi of quasis) {
          const idx = quasis.indexOf(quasi);
          const body = quasis;

          if (quasi.value.raw === "") {
            console.log("isn't it empty?");
            node.quasis[idx] = createTemplateElement("__PLRG__");
            addMutant(MutantType.StringLiteral, node);
            node.quasis[idx] = quasi;
          } else {
            node.quasis[idx] = createTemplateElement("");
          }
        }
        //I think this makes warn
        node.expressions = [];
        addMutant(MutantType.StringLiteral, node);
        Object.assign(node.quasis, save);
        node.expressions = expressions;
      }

      //expression 해준 게 없어.
      for (const expr of expressions) {
        walk.recursive(expr, null, visitor);
      }
    },
    UnaryExpression: (node) => {
      const { visitor, addMutant } = this;
      const { argument, operator } = node;
      switch (operator) {
        case "+":
          node.operator = "-";
          addMutant(MutantType.UnaryOp, node);
          node.operator = operator;
          break;
        case "-":
          node.operator = "+";
          addMutant(MutantType.UnaryOp, node);
          node.operator = operator;
          break;
      }
      walk.recursive(argument, null, visitor);
    },
    UpdateExpression: (node) => {
      const { visitor, addMutant } = this;
      const { argument, operator } = node;

      switch (operator) {
        case "++":
          node.prefix = !node.prefix;
          addMutant(MutantType.Update, node);

          node.prefix = !node.prefix;
          node.operator = "--";
          addMutant(MutantType.Update, node);

          node.operator = operator;
          break;
        case "--":
          node.prefix = !node.prefix;
          addMutant(MutantType.Update, node);

          node.prefix = !node.prefix;
          node.operator = "++";
          addMutant(MutantType.Update, node);

          node.operator = operator;
          break;
      }
      walk.recursive(argument, null, visitor);
    },
    WhileStatement: (node) => {
      const { visitor, addMutant } = this;
      const { test, body } = node;

      if (typeof node.test == "boolean") {
        if (node.test) {
          node.test = createBoolLiteral(!node.test);
          addMutant(MutantType.Cond, node);
          node.test = test;
        } //false는 체크해줄 필요가 없을 듯?
      } else {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      if (test) walk.recursive(test, null, visitor);
      walk.recursive(body, null, visitor);
    },
    // XXX: for assertion
    // DO not modify the code inside the function
    CallExpression: (node) => {
      const { visitor, addMutant } = this;
      const { callee, arguments: args } = node;
      // Not to mutate the assertion function
      if (callee.type === "Identifier" && callee.name === "__assert__") {
        return;
      }
      // Recursively mutate the arguments if it is not the assertion function
      walk.recursive(callee, null, visitor);
      for (const arg of args) walk.recursive(arg, null, visitor);
    },
  };
}

/* Inputs for mutation testing of `example/vector.js`
 *
 * (Problem #2) Killing All Mutants (30 points)
 *
 * Please construct inputs generating a test suite for the `example/vector.js`
 * JavaScript file that kills all the generated mutants.
 *
 * The current inputs kills only 7 out of 220 mutants.
 */

// export const vectorInputs: [string][] = [
//   ["$V([])"],
//   ["$V([1, 2, 3]).dup()"],
// ]

export const vectorInputs: [string][] = [
  ["$V([])"], // Test empty vector creation
  ["$V([1, 2, 3])"],
  ["$V(null)"],
  ["$V({})"],

  ["$V([1, 2, 3]).dup()"], // Test duplication
  ["$V([]).dup()"], // Test duplication

  // Access an element
  ["$V([1, 2, 3]).e(0)"],
  ["$V([1, 2, 3]).e(1)"],
  ["$V([1, 2, 3]).e(2)"],
  ["$V([1, 2, 3]).e(3)"],
  ["$V([1, 2, 3]).e(4)"],
  ["$V([1, 2, 3]).e(-1)"],
  ["$V([1, 2, 3]).e('string')"],
  ["$V([-1, -2, -3]).e(1)"],
  ["$V([1, 2, 3]).e(null)"],
  ["$V([]).e(0)"],

  ["$V([1, 2, 3]).dimensions()"], // Dimensions
  ["$V().dimensions()"],

  ["$V([1, 2, 3]).modulus()"], // Modulus
  ["$V([0, 0, 0]).modulus()"],
  ["$V([]).modulus()"],
  ["$V([function() { return 1; }]).modulus()"],

  ["$V([1, 2, 3]).eql($V([1, 2, 3]))"],
  ["$V([1, 2, 3]).eql($V([3, 2, 1]))"],
  ["$V([1, 2, 3]).eql($V([1, 2]))"],
  ["$V([1, 2, 3]).eql($V([1, 2, 3, 4]))"],
  ["$V([1, 2, 3]).eql(null)"],
  ["$V([1, 2, 3]).eql('string')"],
  ["([1, 2, 3]).eql('string')"],
  ["$V([1, 2, 3]).eql([])"],
  ["$V([1, 2, 3]).eql(4)"],
  ["$V([]).eql($V([]))"],
  ["$V([]).eql($V([1, 2, 3]))"],
  ["$V([]).eql($V({}))"],
  ["$V([1, 2, 3]).eql($V(['1', '2', '3']))"],
  ["$V(['1', '2', '3']).eql($V(['1', '2', '3']))"],
  ["$V(['1', '2', '3']).eql($V([1, 2, 3]))"],
  ["$V([true, true, true]).eql($V([true, true, true]))"],
  ["$V().eql()"],
  ["$V(null).eql($V([1, 2, 3]))"],
  ["$V(undefined).eql($V([1, 2, 3]))"],
  ["$V([0]).eql($V([0]))"],

  ["$V([1, 2, 3]).map(function(x) { x })"], //map
  ["$V([0, 0, 0]).map(function(x) { x/2 })"], //map
  ["$V([1, 2, 3]).map(function(x) { 'x' })"], //map
  ["$V([]).map(function(x) { null })"], //map
  ["$V(['1', '2', '3']).map(function(x) { x })"], //map

  ["$V([1, 2, 3]).each(function(x) { x })"], //each
  ["$V([1, 2, 3]).each(function(x, i) { this.elements[i-1] = x*x; })"],
  ["$V([1, 2, 3]).each(function(x1, x2) { return [ x1++, x2-- ] })"],

  // angleFrom
  ["$V([1, 2, 3]).angleFrom($V([2, 0, 0]))"],
  ["$V([1, 2, 3]).angleFrom($V([]))"],
  ["$V([1, 0]).angleFrom($V([0, 1]))"],
  ["$V([1]).angleFrom(([0]))"],
  ["$V([1, 0]).angleFrom(null))"],
  ["$V([1, 1, 1]).angleFrom($V([2, 2]))"],
  ["$V([-1, -1, -1]).angleFrom($V([1, 1, 1]))"],
  ["$V([0, 0]).angleFrom($V([1, 2]))"],
  ["$V([0, 0]).angleFrom($V([0, 0]))"],
  ["$V([0, 0]).angleFrom($V(['0', '0']))"],
  ["$V([1, 2]).angleFrom($V(['1', 2]))"],
  ["$V(['0', '0']).angleFrom($V(['1', '0']))"],
  ["$V([]).angleFrom('string')"],
  ["$V([]).angleFrom($V([null]))"],
  ["$V([1, 2]).angleFrom()"],
  ["$V([null]).angleFrom()"],

  ["$V([1, 0, 0]).isParallelTo($V([2, -0, 0]))"], // Parallel
  ["$V([1, 0, 0]).isAntiparallelTo($V([-1, 0, 0]))"], // Antiparallel
  ["$V([1, 0, 0]).isPerpendicularTo($V([0, 1, 0]))"], // Perpendicular

  ["$V([1, 0, 0]).isParallelTo($V([]))"], // Parallel
  ["$V([1, 0, 0]).isAntiparallelTo($V([]))"], // Antiparallel
  ["$V([1, 0, 0]).isPerpendicularTo($V([]))"], // Perpendicular

  ["$V([1, 0, 0]).isParallelTo(null))"], // Parallel
  ["$V([1, 0, 0]).isAntiparallelTo(null))"], // Antiparallel
  ["$V([1, 0, 0]).isPerpendicularTo(null))"], // Perpendicular

  ["$V([])).isParallelTo($V([])"], // Parallel
  ["$V([]).isAntiparallelTo($V([]))"], // Antiparallel
  ["$V([]).isPerpendicularTo($V([]))"], // Perpendicular

  ["$V([1, 0, 0]).isParallelTo($V([2]))"], // Parallel
  ["$V([1, 0, 0]).isAntiparallelTo($V([-1]))"], // Antiparallel
  ["$V([1, 0, 0]).isPerpendicularTo($V([0]))"], // Perpendicular

  ["$V([`1`, `0`, `0`]).isPerpendicularTo($V([`0`, `0`, `1`]))"], // Perpendicular
  ["$V([9007199254740991n]).isPerpendicularTo($V(['9007199254740991n']))"], // Perpendicular

  // Add
  ["$V([1, 2, 3]).add($V([1, 1, 1]))"],
  ["$V([1, 2, 3]).add($V([]))"],
  ["$V([1, 2, 3]).add($V([1, 1, 1, 1]))"],
  ["$V([1, 2, 3]).add($V([1]))"],
  ["$V([1, 2, 3]).add(null)"],
  ["$V([1, 2, 3]).add($V(['1', '2', '3']))"],

  // Subtraction
  ["$V([1, 2, 3]).subtract($V([1, 1, 1]))"],
  ["$V([1, 2, 3]).subtract($V([4]))"],
  ["$V([1, 2, 3]).subtract($V([]))"],
  ["$V([1, 2, 3]).subtract($V([1, 2, 3, 4]))"],
  ["$V([1, 2, 3]).subtract(null)"],

  // Scalar multiplication
  ["$V([1, 2, 3]).multiply(2)"],
  ["$V([1, -2, 3]).multiply(-1)"],
  ["$V([1, 2, 3]).multiply(0)"],
  ["$V([1, 2, 3]).multiply(-0)"],
  ["$V([0, 0, 0]).multiply(1)"],
  ["$V([]).multiply(2)"],
  ["$V([]).multiply(null)"],
  ["$V([]).multiply('string')"],

  // Dot product
  ["$V([1, 2, 3]).dot($V([1, 2, 3]))"],
  ["$V([1, 2, 3]).dot($V([]))"],
  ["$V([1, 2, 3]).dot($V({}))"],
  ["$V([1, 2, 3]).dot($V([4]))"],
  ["$V([1, 2, 3]).dot($V([4, 5]))"],
  ["$V([1, 2, 3]).dot($V([4, 5, 6, 7]))"],
  ["$V([1, 2, 3]).dot(null)"],
  ["$V([1, 2, 3]).dot('1', '2', '3')"],
  ["$V(['1', '2', '']).dot('1', '2', '3')"],
  ["$V([1, 2, 3]).dot(4)"],
  ["$V([0, 0, 0]).dot($V([0, 0, 0]))"],
  ["$V([1, 2, -3]).dot($V([-0, -1, -7]))"],

  // Cross product
  ["$V([1, 2, 3]).cross($V([0, 0, 0]))"],
  ["$V([1, 2, 3]).cross($V([3, 2, 1]))"],
  ["$V([1, 2, 3]).cross($V([4, 5, 6, 7]))"],
  ["$V([1, 2, 3]).cross($V([4, 5]))"],
  ["$V([1, 2, 3]).cross($V([]))"],
  ["$V([1, 2, 3]).cross(null)"],
  ["$V([1, 2, 3]).cross('1', '2', '3')"],
  ["$V('['1', '2', '3']).cross('1', '2', '3')"],
  ["$V('['1', '2', '3']).cross($V[1, 2, null])"],

  // Max element
  ["$V([3, 4, 5]).max()"],
  ["$V([]).max()"],
  ["$V([0, -1, -2]).max()"],
  ["$V([1]).max()"],
  ["$V([-0]).max()"],

  // indexOf
  ["$V([1, 2, 3, 2, 1]).indexOf(2)"],
  ["$V([]).indexOf(2)"],
  ["$V([1, 2, 3, 2, 1]).indexOf(1, 2)"],
  ["$V([1, 2, 3, 2, 1]).indexOf(null)"],
  ["$V([1, 2, 3, 2, 1]).indexOf()"],
  ["$V([1]).indexOf(0)"],
  ["$V([1]).indexOf(2)"],
  ["$V([1]).indexOf(-1)"],
  ["$V([1, 2, 3]).indexOf('1')"],

  // distanceFrom
  ["$V([0, 3, 4]).distanceFrom($V([0, 0, 0]))"],
  ["$V([1, 2, 3]).distanceFrom($V([4, 5, 6]))"],
  ["$V([1, 2, 3]).distanceFrom($V([3, 2, 1]))"],
  ["$V([1, 2, 3]).distanceFrom($V([4, 5]))"],
  ["$V([0, 3, 4]).distanceFrom($V([]))"],
  ["$V([1, 2, 3]).distanceFrom(null)"],
  ["$V([1, 2, 3]).distanceFrom({})"],
  ["$V([1, 2, 3]).distanceFrom('string')"],
  ["$V([1, 2, 3]).distanceFrom(4)"],
  ["$V([3, 4]).distanceFrom($V([0, 0]))"],
  ["$V([0, 0, 0]).distanceFrom($V([1, 2, 3]))"],
  ["$V([0, 0, 0]).distanceFrom($V([0, 0, 0]))"],
  ["$V([1, 2, 3]).distanceFrom($V([1, 2, 3]))"],
  ["$V([-1, -2, -3]).distanceFrom($V([1, 2, -3]))"],
  ["$V(['1', '2', '3']).distanceFrom($V(['1', '2', '3']))"],

  ["$V([1, 2, 3]).inspection()"], // Inspection
  ["$V([]).inspection()"], // Inspection
  ["$V(['1', '2']).inspection()"], // Inspection

  ["$V([1, 2, 3]).setElements([4, 5, 6])"], // Set elements
  ["$V([1, 2, 3]).setElements([])"],
  ["$V([1, 2, 3]).setElements($V[])"],
  ["$V([1, 2, 3]).setElements([[1, 2], [3, 4]])"],
  ["$V([1, 2, 3]).setElements()"],
  ["$V([1, 2, 3]).setElements([{'a': 1}, {'b': 2}])"],
  ["$V([1, 2, 3]).setElements(undefined)"],

  [
    "let v = $V([1, 2, 3]); let dup = v.dup(); dup.elements[0] = 10; v.eql(dup)",
  ],

  [
    "let v = $V([1, 2, 3]); v.customProp = 100; v.customMethod = function() { return this.customProp; }; v.customMethod()",
  ],

  [
    "let v = $V([7, 8, 9]); let addResult = v.add.apply(v, [$V([1, 2, 3])]); let subtractResult = v.subtract.call(v, $V([1, 2, 3])); addResult.eql(subtractResult)",
  ],

  ["let code = '$V([10, 11, 12]).modulus()'; eval(code)"],
  ["($V([1, 2, 3]).e(4)).cross($V([1, 2, 3]))"],

  ["$V([1, 2, 3]).angleFrom.call($V([0, 0, 0], $V([0, 0, 0]))"],

  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]), x.elements.length = '3'; x.add($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]), x.elements.length = '3'; x.subtract($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]); x.elements.length = '3'; x.cross($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]); x.elements.length = '3'; x.angleFrom($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]); x.elements.length = 3; x.eql($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]); x.elements.length = '3'; $V([1, 2, 3]).cross(x)",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]); x.elements.length = '3'; x.distanceFrom($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1, 2]); x.elements.length = '3'; x.isPerpendicularTo($V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.isPerpendicularTo.call({ dot: () => '0' }, $V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.isParallelTo.call({ angleFrom: () => '0' }, $V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.isAntiparallelTo.call({ angleFrom: () => '3.141592653589793' }, $V([1, 2, 3]))",
  ],
  [
    "let x = $V([1, 2, 3]); x.elements = $V([1,2,3]); (x.elements).length = '3'; x.eql($V([undefined, undefined, undefined]))",
  ],
  [
    "let x = $V([1, 2]); let els = { elements: { slice: () => '' } }; x.setElements(els)",
  ],
  [
    "let x = $V([0]); let obj = { elements: NaN, length : 1 }; x.distanceFrom(obj)",
  ],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; x.cross(obj)",
  ],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; x.subtract(obj)",
  ],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; x.add(obj)",
  ],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; x.angleFrom(obj)",
  ],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; obj.modulus()",
  ],
  ["let x = $V([1, 2, 3]); x.modulus.call({ dot: () => '0' }, $V([1, 2, 3]))"],
  ["let x = $V([0]); let obj = { elements: NaN, 'length' : 2 }; x(obj)"],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; x.dot(obj)",
  ],
  [
    "let x = $V([0, 1, 2]); let obj = { elements: NaN, length : 3 }; x.eql(obj)",
  ],
  ["let x = $V([0, 1, 2]); let obj = { length: 3 }; x.eql(obj)"],
  [
    "let x = $V([0, 1, 2]); let obj = new Vector(); obj.elements = NaN; x.eql(obj)",
  ],
  [
    "let x = $V([]); let obj = new Vector(); obj.elements = NaN; obj.length = 0; x.eql(obj)",
  ],
];
