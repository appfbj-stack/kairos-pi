/**
 * Conversor Zod → TypeBox (TSchema).
 *
 * O pi-ai usa TypeBox internamente (Tool.parameters: TSchema).
 * Nossas extensions Kairos usam Zod (mais ergonômico).
 * Este adapter converte ZodObject → Type.Object() automaticamente.
 *
 * Cobre os tipos mais comuns (string, number, boolean, enum, optional, array,
 * nested object). Casos raros (unions, refinements complexos) podem precisar
 * de conversão manual no futuro.
 */

import { z } from "zod";
import { Type, type TSchema } from "@earendil-works/pi-ai";

/** Converte um ZodType em TSchema do TypeBox. */
export function zodToTypebox(schema: z.ZodType): TSchema {
  // unwrap optional / nullable / default
  let inner: z.ZodType = schema;
  while (true) {
    const def = inner._def as { typeName?: string; innerType?: z.ZodType };
    if (def.typeName === "ZodOptional" && def.innerType) {
      inner = def.innerType;
      continue;
    }
    if (def.typeName === "ZodNullable" && def.innerType) {
      inner = def.innerType;
      continue;
    }
    if (def.typeName === "ZodDefault" && (def as { innerType?: z.ZodType }).innerType) {
      inner = (def as { innerType: z.ZodType }).innerType;
      continue;
    }
    break;
  }

  const def = inner._def as {
    typeName: string;
    values?: readonly [string, ...string[]];
    innerType?: z.ZodType;
    type?: z.ZodType;
    schema?: z.ZodObject<z.ZodRawShape>;
    shape?: () => z.ZodRawShape;
    valueType?: z.ZodType;
    minLength?: { value: number } | null;
    maxLength?: { value: number } | null;
    minimum?: { value: number } | null;
    maximum?: { value: number } | null;
  };

  switch (def.typeName) {
    case "ZodString": {
      const opts: { minLength?: number; maxLength?: number } = {};
      if (def.minLength?.value) opts.minLength = def.minLength.value;
      if (def.maxLength?.value) opts.maxLength = def.maxLength.value;
      return Type.String(opts);
    }
    case "ZodNumber":
      return Type.Number();
    case "ZodBoolean":
      return Type.Boolean();
    case "ZodLiteral": {
      const lit = (def as unknown as { value: unknown }).value;
      if (typeof lit === "string") return Type.Literal(lit);
      if (typeof lit === "number") return Type.Literal(lit);
      if (typeof lit === "boolean") return Type.Literal(lit);
      return Type.Unknown();
    }
    case "ZodEnum":
      return Type.Union(
        (def.values ?? []).map((v) => Type.Literal(v)) as unknown as never
      );
    case "ZodArray": {
      const valueType = zodToTypebox(def.type ?? Type.Unknown() as unknown as z.ZodType);
      return Type.Array(valueType);
    }
    case "ZodObject": {
      const shape = def.shape?.() ?? {};
      const properties: Record<string, TSchema> = {};
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToTypebox(value as z.ZodType);
      }
      return Type.Object(properties);
    }
    case "ZodNull":
      return Type.Null();
    case "ZodUndefined":
      return Type.Undefined();
    case "ZodUnion": {
      // Pega opções do union (ZodEffects não, mas ZodUnion tem options)
      const opt = (def as unknown as { options?: z.ZodType[] }).options;
      if (opt) {
        return Type.Union(opt.map((o) => zodToTypebox(o)) as unknown as never);
      }
      return Type.Unknown();
    }
    case "ZodAny":
    case "ZodUnknown":
    default:
      return Type.Unknown();
  }
}
