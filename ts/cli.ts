#!/usr/bin/env deno run

import { readAll } from 'https://deno.land/std@0.123.0/streams/mod.ts';
import { parse } from 'https://deno.land/std@0.123.0/flags/mod.ts';
import { decode, encode, encodeResolve, Resolve } from './apix.ts';

const b64Decode = (s: string) => new Uint8Array([...atob(s)].map((c) => c.charCodeAt(0)));

async function processStdin(blob: Uint8Array, method: Method, type: string) {
  const stdin = () => readAll(Deno.stdin);
  switch (method) {
    case 'encode':
      return String.fromCharCode.apply(null, [...await encode(blob, type, await stdin())]);
    case 'decode':
      return JSON.stringify(await decode(blob, type, await stdin()));
    default:
      throw new Error(method ? `${method} not 'encode'/'decode'` : `Missing method`);
  }
}

export type Method = 'encode' | 'decode';

export default async function cli(resolve?: Resolve) {
  const { _: [method, type], resolve: resolveValue, b64 } = parse(Deno.args, {
    boolean: 'b64',
    string: 'resolve',
  });
  // assume --resolve: JSON | base64 encoded proto
  const blob = resolve ?? String(resolveValue).startsWith('{')
    ? encodeResolve(resolve ?? resolveValue)
    : b64Decode(resolveValue);
  const str = method === 'encode-resolve'
    ? String.fromCharCode.apply(null, [...blob])
    : await processStdin(blob, method as Method, String(type));
  console.log(b64 ? btoa(str) : str);
}

if (import.meta.main) {
  await cli();
}
