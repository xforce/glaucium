package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = ["crashstorage.go"],
    importpath = "github.com/xforce/glaucium/pkg/crashstorage/es",
    tags = ["automanaged"],
    deps = [
        "//pkg/crashstorage/interface:go_default_library",
        "//vendor/github.com/pelletier/go-toml:go_default_library",
        "//vendor/gopkg.in/olivere/elastic.v5:go_default_library",
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
    srcs = [":package-srcs"],
    tags = ["automanaged"],
)
