package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "args.go",
        "bytebuffer.go",
        "bytesconv.go",
        "bytesconv_64.go",
        "client.go",
        "coarseTime.go",
        "compress.go",
        "cookie.go",
        "doc.go",
        "fs.go",
        "header.go",
        "http.go",
        "lbclient.go",
        "nocopy.go",
        "peripconn.go",
        "server.go",
        "status.go",
        "stream.go",
        "strings.go",
        "tcpdialer.go",
        "timer.go",
        "uri.go",
        "uri_unix.go",
        "userdata.go",
        "workerpool.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/klauspost/compress/flate:go_default_library",
        "//vendor/github.com/klauspost/compress/gzip:go_default_library",
        "//vendor/github.com/klauspost/compress/zlib:go_default_library",
        "//vendor/github.com/valyala/bytebufferpool:go_default_library",
        "//vendor/github.com/valyala/fasthttp/fasthttputil:go_default_library",
        "//vendor/github.com/valyala/fasthttp/stackless:go_default_library",
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
        "//vendor/github.com/valyala/fasthttp/fasthttputil:all-srcs",
        "//vendor/github.com/valyala/fasthttp/stackless:all-srcs",
    ],
    tags = ["automanaged"],
)
