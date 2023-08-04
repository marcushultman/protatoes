import loadWasm from '../bin/api.js';
import { JsonObject, toJSONByteString } from './json_util.ts';

const {
  createRoot: _createRoot,
  release: _release,
  addProto: _addProto,
  encode: _encode,
  decode: _decode,
  encodeResolve,
  decodeResolve,
} = await loadWasm();

export type { JsonObject };

export type Root = unknown;

export interface FileDescriptorProto {
  name: string;
  package: string;
  dependency?: string[];
}

export function createRoot(prefix: string): Root {
  return _createRoot(prefix);
}

export function release(root: Root) {
  return _release(root);
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

export { decodeResolve, encodeResolve };
