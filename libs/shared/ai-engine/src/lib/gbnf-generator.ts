import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type JsonSchema = {
  type?: string;
  enum?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
};

export class GbnfGenerator {
  private rules: Map<string, string> = new Map();

  public generate(schema: z.ZodTypeAny): string {
    this.rules.clear();
    const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' });
    const rootRuleName = this.visit(jsonSchema, 'root');

    const ruleStrings = Array.from(this.rules.entries())
      .map(([name, body]) => `${name} ::= ${body}`)
      .join('\n');

    const primitives = `
space ::= " "?
string ::=  "\\"" ( [^"\\\\] | "\\\\" (["\\\\/bfnrt] | "u" [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]) )* "\\""
number ::= ("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)?
boolean ::= "true" | "false"
null ::= "null"
ws ::= [ \\t\\n]*`;

    return `root ::= ${rootRuleName}\n${ruleStrings}\n${primitives}`;
  }

  private visit(schema: any, name: string): string {
    if (!schema) return 'null';
    const ruleName = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (this.rules.has(ruleName)) return ruleName;

    if (schema.type === 'object') {
      return this.visitObject(schema, ruleName);
    } else if (schema.type === 'array') {
      return this.visitArray(schema, ruleName);
    } else if (schema.enum) {
      return this.visitEnum(schema, ruleName);
    } else if (schema.type === 'string') {
      return 'string';
    } else if (schema.type === 'number' || schema.type === 'integer') {
      return 'number';
    } else if (schema.type === 'boolean') {
      return 'boolean';
    }
    return 'string';
  }

  private visitObject(schema: any, ruleName: string): string {
    const props = schema.properties || {};
    const propRules: string[] = [];

    Object.entries(props).forEach(([key, propSchema], index, arr) => {
      const isLast = index === arr.length - 1;
      const propRule = this.visit(propSchema, `${ruleName}_${key}`);
      let ruleStr = `"\\"${key}\\":" ws ${propRule}`;
      if (!isLast) {
        ruleStr += ' "," ws ';
      }
      propRules.push(ruleStr);
    });

    const body = `"{" ws ${propRules.join('')} "}" ws`;
    this.rules.set(ruleName, body);
    return ruleName;
  }

  private visitArray(schema: any, ruleName: string): string {
    const itemSchema = schema.items;
    const itemRule = this.visit(itemSchema, `${ruleName}_item`);
    const body = `"[" ws ( ${itemRule} ("," ws ${itemRule})* )? "]" ws`;
    this.rules.set(ruleName, body);
    return ruleName;
  }

  private visitEnum(schema: any, ruleName: string): string {
    const options = schema.enum.map((v: string) => `"\\"${v}\\""`).join(' | ');
    const body = `( ${options} )`;
    this.rules.set(ruleName, body);
    return ruleName;
  }
}

export const gbnfGenerator = new GbnfGenerator();
