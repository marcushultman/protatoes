# Protatoes

*Protatoes* makes using [Protocol Buffers (a.k.a. protobuf)](https://developers.google.com/protocol-buffers) in JavaScript/TypeScript environments easy. It provides protobuf binary wire format-to-JSON conversion, and consists of multiple TypeScript APIs on different levels, depending on need.

Currently, most API entrypoints requires [Deno](https://deno.land/), but that might change in the future. The [WASM](#wasm) entrypoint should run in most environments and the [Service](#service) is standalone.

## High level API
_`ts/apix.ts` (For `Deno`)_

The `ts/apix.ts` is the most recommended entry point. This entrypoint fetches proto sources via URLs (local or on the internet) and handles imports automatically.

### Proto sources

To describe where proto sources should be fetched from, this API introduces the concept of a `Resolve` protobuf message:
```
interface File {
  name: string;
  source: string;
}

interface Resolve {
  prefix?: string;
  entries?: string[];
  includes?: string[];
  files?: File[];
  authTokens?: string;
}
```

### API

| `encodeResolve(resolve: Resolve): Uint8Array`
| --- |
| Encodes a `Resolve` JSON object to protobuf binary wire format.

| `encode(blob: Uint8Array, type: string, obj: JsonObject<T>): Promise<Uint8Array>`
| --- |
| Encodes a `obj` JSON object of a `type` which is described in the proto sources referenced in the `Resolve` object encoded in protobuf binary wire format provided as `blob`. Returns the message in protobuf binary wire format.
| The `JsonObject` can be provided in utf8 bytes (`Uint8Array`), string or as a JSON object.

| `decode<T>(blob: Uint8Array, type: string, bin: Uint8Array)`
| --- |
| Decodes a `bin` message in protobuf binary wire format of a `type` which is described in the proto sources referenced in the `Resolve` object encoded in protobuf binary wire format provided as `blob`. Returns the message as a JSON object.

## CLI
_(For `Deno`)_

The `CLI` can be run as a `Deno` main script:
```
$ deno run -A ts/cli.ts --resolve <resolve> <encode/decode/encode-resolve> <type (if encode/decode)>
```
It reads input from stdin and outputs the encoded/decoded message to stdout.
The `--resolve` parameter can be provided in either JSON or in base64 encoded protobuf binary wire format.
The `--b64` flag can be added to print the output as base64.

### Wrap the CLI

The `ts/cli` can be wrapped where the user provides a default `Resolve`:
```
// mycli.ts
import cli from 'ts/cli.ts';
const resolve: Resolve = { ... };
await cli(resolve);
```
Usage:
```
$ deno run -A mycli.ts <encode/decode> <type>
```

## Service

A `Protatoes-as-a-service` is hosted at https://protatoes.deno.dev/ and provides a REST API. Both endpoints accepts a `Resolve` object as a `x-resolve` header (and type `b64`(default)/`json` in `x-resolve-type`).

| `/encode/:type`
| --- |
| Requires `content-type` set to `application/json` (or empty), and the JSON object in the request body. Responds with `200 OK` and the protobuf binary wire format in the response body.

| `/decode/:type`
| --- |
| Requires `content-type` set to `application/protobuf` (or empty), and the message in protobuf binary wire format in the request body. Responds with `200 OK` and the JSON object in the response body.

## Low level API
_`ts/api.ts`_

The `ts/api.ts` is the least recommended entry point. It wraps [`bin/api.js`](#wasm) with strongly typed functions and includes JSON conversion. The user is responsible for creating and maintaining `Root`-objects (via `createRoot`/`release`) directly. A root object can be populated with `.proto` source files given the source and filename directly, but the user is responsible for providing dependencies. Once the proto files are parsed and added, `encode`/`decode` can be called with the `Root` containing the message definitions.

This API works currently only in `Deno`, but the goal is to work wherever `bin/api.js` works.

## WASM
_`bin/api.js`_

At its core, `bin/api.js` wraps [`json_util.h`](https://developers.google.com/protocol-buffers/docs/reference/cpp/google.protobuf.util.json_util) in a WASM module (compiled with _Emscripten_ and _Embind_). It's compiled as a single file with ES6 export, including system interface bindings, and should run in most environments (`Browser`, `Node`, `Deno`), but may need transpiling/bundling and polyfills.
