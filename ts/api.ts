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

export type JsonObject<T> = Uint8Array | string | NonNullable<T>;

function toJSONByteString(obj: JsonObject<unknown>) {
  if (obj instanceof Uint8Array) {
    return obj;
  }
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return new TextEncoder().encode(str);
}

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

export function encode<T>(root: Root, type: string, obj: JsonObject<T>): Uint8Array {
  return _encode(root, type, toJSONByteString(obj)).arr().slice(0);
}

export function decode<T>(root: Root, type: string, bin: Uint8Array): T {
  return JSON.parse(_decode(root, type, bin));
}

export interface File {
  name: string;
  source: string;
}

export interface Resolve {
  prefix?: string;
  entries?: string[];
  includes?: string[];
  files?: File[];
  authTokens?: string;
}

export function encodeResolve(obj: JsonObject<Resolve>): Uint8Array {
  return _encodeResolve(toJSONByteString(obj)).arr().slice(0);
}

export function decodeResolve<Resolve>(bin: Uint8Array): Resolve {
  return JSON.parse(_decodeResolve(bin));
}
