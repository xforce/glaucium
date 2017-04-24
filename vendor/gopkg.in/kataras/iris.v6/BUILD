package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "addr.go",
        "compression.go",
        "configuration.go",
        "context.go",
        "doc.go",
        "fs.go",
        "handler.go",
        "iris.go",
        "policy.go",
        "response_recorder.go",
        "response_writer.go",
        "route.go",
        "router.go",
        "serializer.go",
        "status.go",
        "transaction.go",
        "updater.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/BurntSushi/toml:go_default_library",
        "//vendor/github.com/geekypanda/httpcache:go_default_library",
        "//vendor/github.com/google/go-github/github:go_default_library",
        "//vendor/github.com/hashicorp/go-version:go_default_library",
        "//vendor/github.com/imdario/mergo:go_default_library",
        "//vendor/github.com/iris-contrib/formBinder:go_default_library",
        "//vendor/github.com/kataras/go-errors:go_default_library",
        "//vendor/github.com/klauspost/compress/gzip:go_default_library",
        "//vendor/github.com/microcosm-cc/bluemonday:go_default_library",
        "//vendor/github.com/russross/blackfriday:go_default_library",
        "//vendor/github.com/valyala/bytebufferpool:go_default_library",
        "//vendor/golang.org/x/crypto/acme/autocert:go_default_library",
        "//vendor/gopkg.in/yaml.v2:go_default_library",
    ],
)

filegroup(
    name = "package-srcs",
    srcs = glob(["**"]),
    tags = ["automanaged"],
    visibility = ["//visibility:private"],
)

filegroup(
    name = "all-srcs",
    srcs = [
        ":package-srcs",
        "//vendor/gopkg.in/kataras/iris.v6/adaptors/cors:all-srcs",
        "//vendor/gopkg.in/kataras/iris.v6/adaptors/httprouter:all-srcs",
        "//vendor/gopkg.in/kataras/iris.v6/adaptors/view:all-srcs",
    ],
    tags = ["automanaged"],
)
