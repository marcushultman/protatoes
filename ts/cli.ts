#!/usr/bin/env deno run

import { assert } from 'https://deno.land/std@0.123.0/testing/asserts.ts';
import { readAll, writeAll } from 'https://deno.land/std@0.123.0/streams/mod.ts';
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
      return blob;
    case 'encode':
      return await encode(blob, type, await stdin());
    case 'decode':
      return new TextEncoder().encode(JSON.stringify(await decode(blob, type, await stdin())));
    default:
      throw new Error(method ? `${method} not 'encode'/'decode'` : `Missing method`);
  }
}

const btoaArr = (arr: Uint8Array) =>
  new TextEncoder().encode(btoa(String.fromCharCode.apply(null, [...arr])));

export default async function cli(resolve?: Resolve) {
  const { _: [method, type], resolve: resolveValue, b64 } = parse(Deno.args, {
    boolean: 'b64',
    string: 'resolve',
  });
  const blob = resolve ? encodeResolve(resolve) : getResolve(resolveValue);
  const arr = await processStdin(blob, String(method), String(type));
  await writeAll(Deno.stdout, b64 ? btoaArr(arr) : arr);
}

if (import.meta.main) {
  await cli();
}
