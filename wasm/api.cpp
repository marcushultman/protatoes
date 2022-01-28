#include <string>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <google/protobuf/compiler/parser.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/descriptor_database.h>
#include <google/protobuf/io/tokenizer.h>
#include <google/protobuf/io/zero_copy_stream_impl_lite.h>
#include <google/protobuf/util/json_util.h>
#include <google/protobuf/util/type_resolver_util.h>

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

  void copyProto(const FileDescriptorProto &proto) { _db->Add(proto); }
  void moveProto(FileDescriptorProto *proto) { _db->AddAndOwn(proto); }

  util::TypeResolver *resolver() const { return _type_resolver.get(); }
  std::string makeTypeUrl(const std::string &name) const { return _prefix + "/" + name; }

 private:
  std::string _prefix;
  std::unique_ptr<SimpleDescriptorDatabase> _db;
  std::unique_ptr<DescriptorPool> _pool;
  std::unique_ptr<util::TypeResolver> _type_resolver;
};

}  // namespace

Root *createRoot(std::string prefix) {
  return std::make_unique<Root>(prefix).release();
}

void release(Root *root) {
  std::unique_ptr<Root>(root).reset();
}

//

FileDescriptorProto *parseFile(std::string name, std::string source) {
  auto parser = compiler::Parser();
  auto stream = io::ArrayInputStream(source.data(), source.size());
  auto tokenizer = io::Tokenizer(&stream, nullptr);
  auto proto = std::make_unique<FileDescriptorProto>();
  bool ok = parser.Parse(&tokenizer, proto.get());
  proto->set_name(std::move(name));
  assert(ok);
  return proto.release();
}

void copyProto(Root *root, const FileDescriptorProto *proto) {
  root->copyProto(*proto);
}

void moveProto(Root *root, FileDescriptorProto *proto) {
  root->moveProto(proto);
}

//

using namespace google::protobuf::util;

emscripten::val encode(Root *root, std::string type, std::string json) {
  std::string str;
  JsonToBinaryString(root->resolver(), root->makeTypeUrl(type), json, &str);
  return emscripten::val(
      emscripten::typed_memory_view(str.size(), reinterpret_cast<uint8_t *>(str.data())));
}

std::string decode(Root *root, std::string type, std::string bin) {
  std::string json;
  BinaryToJsonString(root->resolver(), root->makeTypeUrl(type), bin, &json);
  return json;
}

using emscripten::allow_raw_pointers;

EMSCRIPTEN_BINDINGS(my_module) {
  emscripten::class_<FileDescriptorProto>("FileDescriptorProto");
  emscripten::class_<Root>("Root");
  emscripten::register_vector<uint8_t>("uint8_t");

  emscripten::function("createRoot", &createRoot, allow_raw_pointers());
  emscripten::function("release", &release, allow_raw_pointers());

  emscripten::function("parseFile", &parseFile, allow_raw_pointers());
  emscripten::function("copyProto", &copyProto, allow_raw_pointers());
  emscripten::function("moveProto", &moveProto, allow_raw_pointers());

  emscripten::function("encode", &encode, allow_raw_pointers());
  emscripten::function("decode", &decode, allow_raw_pointers());
}
