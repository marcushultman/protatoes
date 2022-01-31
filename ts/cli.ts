#!/usr/bin/env deno run

import { assert } from 'https://deno.land/std@0.123.0/testing/asserts.ts';
import { readAll } from 'https://deno.land/std@0.123.0/streams/mod.ts';
import { parse } from 'https://deno.land/std@0.123.0/flags/mod.ts';
import { decode, encode, encodeResolve, Resolve } from './apix.ts';
import { getEncoder } from './util.ts';

const getResolve = (resolveRaw: string) => {
  const resolveType = String(resolveRaw).startsWith('{') ? 'json' : 'b64';
  const resolveEncoder = getEncoder(resolveType);
  assert(resolveEncoder, `Invalid --resolve: '${resolveType}'`);
  return resolveEncoder(resolveRaw);
};

const stdin = () => readAll(Deno.stdin);

async function processStdin(blob: Uint8Array, method: string, type: string) {
  switch (method) {
    case 'encode-resolve':
      return String.fromCharCode.apply(null, [...blob]);
    case 'encode':
      return String.fromCharCode.apply(null, [...await encode(blob, type, await stdin())]);
    case 'decode':
      return JSON.stringify(await decode(blob, type, await stdin()));
    default:
      throw new Error(method ? `${method} not 'encode'/'decode'` : `Missing method`);
  }
}

export default async function cli(resolve?: Resolve) {
  const { _: [method, type], resolve: resolveValue, b64 } = parse(Deno.args, {
    boolean: 'b64',
    string: 'resolve',
  });
  const blob = resolve ? encodeResolve(resolve) : getResolve(resolveValue);
  const str = await processStdin(blob, String(method), String(type));
  console.log(b64 ? btoa(str) : str);
}

if (import.meta.main) {
  await cli();
}
