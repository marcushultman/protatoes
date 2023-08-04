# Protatoes

*Protatoes* makes using [Protocol Buffers (a.k.a. protobuf)](https://developers.google.com/protocol-buffers) in JavaScript/TypeScript environments a breeze. It provides multiple APIs for converting protobuf binary wire format to and from JSON, each suitable for different use-cases.

## High level API
_`dist/apix.js` (bundled and minified for Node/Browser)_
_`ts/apix.ts` (for Deno)_

`apix` enables JSON encoding & decoding of protobuf messages described by .proto sources fetched via URLs (local or on the internet) and handles imports automatically.

### Proto sources

To describe from where .proto sources should be fetched, this API introduces the concept of a `Resolve` object:
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

The smallest valid `Resolve` object is the empty object `{}`, but that doesn't describe any messages and is pretty useless.

#### From URL

A more useful `Resolve` object can describe .proto sources located on the web:

```
{
  entries: ['myproto1.proto'],
  includes: ['https://myprotos.com']
}
```

All `entries` will be fetched relative to one of the `includes` paths, including nested imports.

#### From source

Sources can be loaded manually:

```
{
  files: [{ name: 'myproto1.proto', source: '...' }]
}
```

_NOTE: Nested imports are currently not supported but may be added in the future._

#### Auth tokens

For .proto sources that are hosted on private servers, the `Resolve` object supports an `authTokens` option:

```
{
  ...,
  authTokens: 'token1@myorg.com;token2@someorg.com'
}
```

When the .proto sources are being fetched, the `Authorization` header of the request is set to the value of `Bearer {token}` for the matching hostname.

### API

Once a `Resolve` object is configured, it can be encoded into protobuf binary wire format for use in calls to `encode()` & `decode()`.

| `encodeResolve(resolve: JsonObject<Resolve>): Uint8Array`
| --- |
| Encodes a `Resolve` JSON object to protobuf binary wire format.

| `encode<T>(blob: Uint8Array, type: string, obj: JsonObject<T>): Promise<Uint8Array>`
| --- |
| Encodes a `obj` JSON object of a `type` which is described in the proto sources referenced in the `Resolve` object encoded in protobuf binary wire format provided as `blob`. Returns the message in protobuf binary wire format.
| The `JsonObject` can be provided in utf8 bytes (`Uint8Array`), string or as a JSON object.

| `decode<T>(blob: Uint8Array, type: string, bin: Uint8Array): Promise<T>`
| --- |
| Decodes a `bin` message in protobuf binary wire format of a `type` which is described in the proto sources referenced in the `Resolve` object encoded in protobuf binary wire format provided as `blob`. Returns the message as a JSON object.

## CLI
_(For Deno)_

The `CLI` can be run as a Deno script:
```
$ deno run -A ts/cli.ts --resolve <resolve> <encode/decode/encode-resolve> <type (if encode/decode)>
```
It reads input from stdin and outputs the encoded/decoded message to stdout.
The `--resolve` parameter can be provided as either a JSON string or in base64 encoded protobuf binary wire format.
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

`Protatoes-as-a-service` is hosted at https://protatoes.deno.dev/ and provides a REST API. Both endpoints accepts a `Resolve` object in the `x-resolve` header (and type `b64`(default)/`json` in `x-resolve-type`).

| `/encode/:type`
| --- |
| Requires `content-type` set to `application/json` (or empty), and the JSON object in the request body. Responds with `200 OK` and the protobuf binary wire format in the response body.

| `/decode/:type`
| --- |
| Requires `content-type` set to `application/protobuf` (or empty), and the message in protobuf binary wire format in the request body. Responds with `200 OK` and the JSON object in the response body.

## Low level API
_`dist/api.js` (bundled and minified for Node/Browser)_
_`ts/api.ts` (for Deno)_

`api` is the most bare-bones API where the user is responsible for creating and maintaining `Root`-objects (via `createRoot`/`release`) directly. A root object can be populated with `.proto` source files given the source and filename directly, but the user is responsible for providing dependencies. Once the proto files are added to a `Root`, `encode`/`decode` can be called with the `Root` containing the message definitions.

## WASM
_`bin/api.js` (for Node/Browser/Deno)_

At its core, `bin/api.js` wraps the C++ [`json_util.h`](https://developers.google.com/protocol-buffers/docs/reference/cpp/google.protobuf.util.json_util) functionality in a WASM module (compiled with _Emscripten_ and _Embind_). It's compiled as a single file with ES6 export, including system interface bindings which should run in most environments (Node/Browser/Deno).
