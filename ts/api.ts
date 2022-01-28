import loadWasm from '../bin/api.js';
import * as path from 'https://deno.land/std@0.123.0/path/mod.ts';

const {
  createRoot,
  decode: _decode,
  encode: _encode,
  addProto: _addProto,
  release,
} = await loadWasm();

export { createRoot, release };

export type Root = unknown;

export function addProto(root: Root, name: string, source: string) {
  return JSON.parse(_addProto(root, name, source));
}

export function encode(root: Root, type: string, obj: unknown): Uint8Array {
  return _encode(root, type, JSON.stringify(obj)).arr().slice(0);
}

export function decode<T>(root: Root, type: string, bin: Uint8Array): T {
  return JSON.parse(_decode(root, type, bin));
}

export async function addProtoDeep(root: Root, url: URL) {
  const name = path.basename(url.pathname);
  const source = await fetch(url).then((res) => res.text());
  const descriptor = addProto(root, name, source);
  return [
    descriptor,
    ...await Promise.all(
      (descriptor.dependency ?? []).map((dep: string) => addProtoDeep(root, new URL(dep, url))),
    ),
  ];
}
