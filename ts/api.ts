import loadWasm from '../bin/api.js';

const {
  createRoot,
  decode: _decode,
  decodeResolve: _decodeResolve,
  encode: _encode,
  encodeResolve: _encodeResolve,
  addProto: _addProto,
  release,
} = await loadWasm();

export { createRoot, release };

export type Root = unknown;

export interface FileDescriptorProto {
  name: string;
  package: string;
  dependency?: string[];
}

export function addProto(root: Root, name: string, source: string): FileDescriptorProto {
  return JSON.parse(_addProto(root, name, source));
}

export function encode(root: Root, type: string, obj: unknown): Uint8Array {
  return _encode(root, type, JSON.stringify(obj)).arr().slice(0);
}

export function decode<T>(root: Root, type: string, bin: Uint8Array): T {
  return JSON.parse(_decode(root, type, bin));
}

export interface File {
  name: string;
  source: string;
}

export interface Query {
  params: Record<string, string>;
}

export interface Resolve {
  prefix?: string;
  entry?: string;
  includes?: string[];
  files?: File[];
  query?: Record<string, Query>;
}

export function encodeResolve(obj: Resolve): Uint8Array {
  return _encodeResolve(JSON.stringify(obj)).arr().slice(0);
}

export function decodeResolve<Resolve>(bin: Uint8Array): Resolve {
  return JSON.parse(_decodeResolve(bin));
}
