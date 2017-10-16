package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_binary",
    "go_library",
)

go_binary(
    name = "processor",
    importpath = "github.com/xforce/glaucium/cmd/processor",
    library = ":go_default_library",
    tags = ["automanaged"],
)

go_library(
    name = "go_default_library",
    srcs = ["processor.go"],
    importpath = "github.com/xforce/glaucium/cmd/processor",
    tags = ["automanaged"],
    deps = ["//cmd/processor/app:go_default_library"],
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
        "//cmd/processor/app:all-srcs",
    ],
    tags = ["automanaged"],
)
