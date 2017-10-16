package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = ["crashstorage.go"],
    importpath = "github.com/xforce/glaucium/pkg/crashstorage",
    tags = ["automanaged"],
    deps = [
        "//pkg/crashstorage/es:go_default_library",
        "//pkg/crashstorage/fs:go_default_library",
        "//pkg/crashstorage/interface:go_default_library",
        "//pkg/crashstorage/s3:go_default_library",
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
        "//pkg/crashstorage/es:all-srcs",
        "//pkg/crashstorage/fs:all-srcs",
        "//pkg/crashstorage/interface:all-srcs",
        "//pkg/crashstorage/rabbitmq:all-srcs",
        "//pkg/crashstorage/s3:all-srcs",
    ],
    tags = ["automanaged"],
)
