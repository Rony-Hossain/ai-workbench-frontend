import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class GbnfGenerator {
  private rules: Map<string, string> = new Map();

  public generate(schema: z.ZodTypeAny): string {
    this.rules.clear();
    
    // 1. Convert Zod to JSON Schema
    const jsonResult = zodToJsonSchema(schema, { target: 'openApi3' });
    
    // FIX 1: Unwrap the schema if it's wrapped in { schema: ... } or definitions
    const rootSchema = (jsonResult as any).schema ?? jsonResult;
    
    // 2. Generate Rules (Start with distinct root_value)
    const rootValueName = this.visit(rootSchema, 'root_value');

    const ruleStrings = Array.from(this.rules.entries())
      .map(([name, body]) => `${name} ::= ${body}`)
      .join('\n');

    // 3. Primitive Definitions (Strict JSON)
    const primitives = `
space ::= " "?
string ::=  "\\\"" ( [^"\\] | "\\\\")* "\\\""
number ::= ("-"? ([0-9] | [1-9] [0-9]*)) ("." [0-9]+)? ([eE] [-+]? [0-9]+)?
boolean ::= "true" | "false"
null ::= "null"
ws ::= [ \t\n]*`;

    return `root ::= ${rootValueName}\n${ruleStrings}\n${primitives}`;
  }

  private visit(schema: any, name: string): string {
    if (!schema) return 'null';
    
    const ruleName = name.replace(/[^a-zA-Z0-9_]/g, '_');
    if (this.rules.has(ruleName)) return ruleName;

    // FIX 2: Handle OpenAPI 3 "nullable: true"
    if (schema.nullable === true) {
      // Create a non-nullable version of the schema
      const nonNullSchema = { ...schema, nullable: undefined };
      const a = this.visit(nonNullSchema, `${ruleName}_val`);
      const b = this.visit({ type: 'null' }, `${ruleName}_null`);
      const body = `( ${a} | ${b} )`;
      this.rules.set(ruleName, body);
      return ruleName;
    }

    // Handle "OneOf" / "AnyOf" (Zod unions often compile to this)
    if (schema.oneOf || schema.anyOf) {
      const variants = schema.oneOf || schema.anyOf;
      const options = variants.map((v: any, i: number) => 
        this.visit(v, `${ruleName}_opt_${i}`)
      );
      const body = `( ${options.join(' | ')} )`;
      this.rules.set(ruleName, body);
      return ruleName;
    }

    // Dispatch Types
    switch (schema.type) {
      case 'object': return this.visitObject(schema, ruleName);
      case 'array': return this.visitArray(schema, ruleName);
      case 'string': 
        if (schema.enum) return this.visitEnum(schema, ruleName);
        return 'string';
      case 'number':
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'null': return 'null';
      default: return 'string'; // Safe fallback
    }
  }

  private visitObject(schema: any, ruleName: string): string {
    const props = schema.properties || {};
    const keys = Object.keys(props);
    
    if (keys.length === 0) {
      this.rules.set(ruleName, `"{" ws "}"`);
      return ruleName;
    }

    const propRules: string[] = [];
    keys.forEach((key, index) => {
      const propSchema = props[key];
      const isLast = index === keys.length - 1;
      const propRule = this.visit(propSchema, `${ruleName}_${key}`);
      
      // FIX 3: Allow whitespace around colon ("key" : "value")
      let ruleStr = `"\\\"${key}\\\"" ws ":" ws ${propRule}`;
      
      if (!isLast) ruleStr += ' "," ws ';
      propRules.push(ruleStr);
    });

    const body = `"{" ws ${propRules.join('')} "}" ws`;
    this.rules.set(ruleName, body);
    return ruleName;
  }

  private visitArray(schema: any, ruleName: string): string {
    const itemSchema = schema.items;
    if (!itemSchema) {
       this.rules.set(ruleName, `"[" ws "]"`);
       return ruleName;
    }
    const itemRule = this.visit(itemSchema, `${ruleName}_item`);
    const body = `"[" ws ( ${itemRule} ("," ws ${itemRule})* )? "]" ws`;
    this.rules.set(ruleName, body);
    return ruleName;
  }

  private visitEnum(schema: any, ruleName: string): string {
    const options = schema.enum.map((v: string) => `"\\\"${v}\\\""`).join(' | ');
    const body = `( ${options} )`;
    this.rules.set(ruleName, body);
    return ruleName;
  }
}

export const gbnfGenerator = new GbnfGenerator();
