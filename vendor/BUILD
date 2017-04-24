package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "cgo_genrule",
    "go_binary",
    "go_library",
    "go_test",
)

filegroup(
    name = "all-srcs",
    srcs = [
        ":package-srcs",
        "//vendor/github.com/BurntSushi/toml:all-srcs",
        "//vendor/github.com/Joker/jade:all-srcs",
        "//vendor/github.com/aymerick/raymond:all-srcs",
        "//vendor/github.com/eknkc/amber:all-srcs",
        "//vendor/github.com/flosch/pongo2:all-srcs",
        "//vendor/github.com/geekypanda/httpcache:all-srcs",
        "//vendor/github.com/google/go-github/github:all-srcs",
        "//vendor/github.com/google/go-querystring/query:all-srcs",
        "//vendor/github.com/hashicorp/go-version:all-srcs",
        "//vendor/github.com/imdario/mergo:all-srcs",
        "//vendor/github.com/iris-contrib/formBinder:all-srcs",
        "//vendor/github.com/juju/errors:all-srcs",
        "//vendor/github.com/kataras/go-errors:all-srcs",
        "//vendor/github.com/kataras/go-template:all-srcs",
        "//vendor/github.com/klauspost/compress/flate:all-srcs",
        "//vendor/github.com/klauspost/compress/gzip:all-srcs",
        "//vendor/github.com/klauspost/compress/zlib:all-srcs",
        "//vendor/github.com/klauspost/cpuid:all-srcs",
        "//vendor/github.com/klauspost/crc32:all-srcs",
        "//vendor/github.com/microcosm-cc/bluemonday:all-srcs",
        "//vendor/github.com/pelletier/go-buffruneio:all-srcs",
        "//vendor/github.com/pelletier/go-toml:all-srcs",
        "//vendor/github.com/rs/cors:all-srcs",
        "//vendor/github.com/rs/xhandler:all-srcs",
        "//vendor/github.com/russross/blackfriday:all-srcs",
        "//vendor/github.com/shurcooL/sanitized_anchor_name:all-srcs",
        "//vendor/github.com/valyala/bytebufferpool:all-srcs",
        "//vendor/github.com/valyala/fasthttp:all-srcs",
        "//vendor/golang.org/x/crypto/acme:all-srcs",
        "//vendor/golang.org/x/net/context:all-srcs",
        "//vendor/golang.org/x/net/html:all-srcs",
        "//vendor/gopkg.in/kataras/iris.v6:all-srcs",
        "//vendor/gopkg.in/olivere/elastic.v5:all-srcs",
        "//vendor/gopkg.in/yaml.v2:all-srcs",
    ],
    tags = ["automanaged"],
)

filegroup(
    name = "package-srcs",
    srcs = glob(["**"]),
    tags = ["automanaged"],
    visibility = ["//visibility:private"],
)
