package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_binary",
    "go_library",
)

go_binary(
    name = "webapp",
    importpath = "github.com/xforce/glaucium/cmd/webapp",
    library = ":go_default_library",
    tags = ["automanaged"],
)

go_library(
    name = "go_default_library",
    srcs = ["webapp.go"],
    importpath = "github.com/xforce/glaucium/cmd/webapp",
    tags = ["automanaged"],
    deps = ["//cmd/webapp/app:go_default_library"],
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
        "//cmd/webapp/app:all-srcs",
    ],
    tags = ["automanaged"],
)
