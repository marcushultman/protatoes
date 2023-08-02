#include <string>
#include <unordered_map>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <google/protobuf/compiler/parser.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/descriptor_database.h>
#include <google/protobuf/io/tokenizer.h>
#include <google/protobuf/io/zero_copy_stream_impl_lite.h>
#include <google/protobuf/util/json_util.h>
#include <google/protobuf/util/type_resolver_util.h>
#include "proto/protatoes.pb.h"

namespace {
using namespace google::protobuf;

struct Root {
  Root(std::string prefix) {
    _prefix = prefix;
    _db = std::make_unique<SimpleDescriptorDatabase>();
    _pool = std::make_unique<DescriptorPool>(_db.get());
    _type_resolver = std::unique_ptr<util::TypeResolver>(
        util::NewTypeResolverForDescriptorPool(_prefix, _pool.get()));
  }

  bool add(FileDescriptorProto *proto) { return _db->AddAndOwn(proto); }

  util::TypeResolver *resolver() const { return _type_resolver.get(); }
  std::string makeTypeUrl(const std::string &name) const { return _prefix + "/" + name; }

 private:
  std::string _prefix;
  std::unique_ptr<SimpleDescriptorDatabase> _db;
  std::unique_ptr<DescriptorPool> _pool;
  std::unique_ptr<util::TypeResolver> _type_resolver;
};

struct Encoded {
  std::string str;

  emscripten::val arr() {
    return emscripten::val(
        emscripten::typed_memory_view(str.size(), reinterpret_cast<uint8_t *>(str.data())));
  }
};

}  // namespace

Root *createRoot(std::string prefix) {
  return std::make_unique<Root>(prefix).release();
}

void release(Root *root) {
  std::unique_ptr<Root>(root).reset();
}

using namespace google::protobuf::util;

FileDescriptorProto *parseFile(std::string name, std::string source) {
  auto parser = compiler::Parser();
  auto stream = io::ArrayInputStream(source.data(), source.size());
  auto tokenizer = io::Tokenizer(&stream, nullptr);
  auto proto = std::make_unique<FileDescriptorProto>();
  auto parse_ok = parser.Parse(&tokenizer, proto.get());
  assert(parse_ok);
  proto->set_name(std::move(name));
  return proto.release();
}

std::string addProto(Root *root, std::string name, std::string source) {
  assert(!name.empty());
  auto proto = parseFile(std::move(name), std::move(source));
  auto add_ok = root->add(proto);
  assert(add_ok);
  std::string json;
  MessageToJsonString(*proto, &json);
  return json;
}

Encoded encode(Root *root, std::string type, std::string json) {
  Encoded encoded;
  auto encode_ok =
      JsonToBinaryString(root->resolver(), root->makeTypeUrl(type), json, &encoded.str).ok();
  assert(encode_ok);
  return encoded;
}

std::string decode(Root *root, std::string type, std::string bin) {
  std::string json;
  auto decode_ok = BinaryToJsonString(root->resolver(), root->makeTypeUrl(type), bin, &json).ok();
  assert(decode_ok);
  return json;
}

Encoded encodeResolve(std::string json) {
  Encoded encoded;
  static protatoes::Resolve resolve;
  resolve.Clear();
  auto encode_ok = JsonStringToMessage(json, &resolve).ok();
  assert(encode_ok);
  resolve.SerializeToString(&encoded.str);
  return encoded;
}

std::string decodeResolve(std::string bin) {
  std::string json;
  static protatoes::Resolve resolve;
  auto parse_ok = resolve.ParseFromString(bin);
  assert(parse_ok);
  MessageToJsonString(resolve, &json);
  return json;
}

using emscripten::allow_raw_pointers;

EMSCRIPTEN_BINDINGS(my_module) {
  emscripten::class_<FileDescriptorProto>("FileDescriptorProto");
  emscripten::class_<Root>("Root");
  emscripten::class_<Encoded>("Encoded").function("arr", &Encoded::arr);

  emscripten::function("createRoot", &createRoot, allow_raw_pointers());
  emscripten::function("release", &release, allow_raw_pointers());

  emscripten::function("addProto", &addProto, allow_raw_pointers());

  emscripten::function("encode", &encode, allow_raw_pointers());
  emscripten::function("decode", &decode, allow_raw_pointers());

  emscripten::function("encodeResolve", &encodeResolve);
  emscripten::function("decodeResolve", &decodeResolve);
}
