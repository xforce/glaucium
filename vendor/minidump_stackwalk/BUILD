package(default_visibility = ["//visibility:public"])

licenses(["notice"])

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

cc_library(
    name = "thingy",
    hdrs = glob(["**/*.h"]),
    includes = ["."],
)

cc_library(
    name = "jsoncpp",
    srcs = [
        "jsoncpp-src-0.5.0/src/lib_json/json_reader.cpp",
        "jsoncpp-src-0.5.0/src/lib_json/json_value.cpp",
        "jsoncpp-src-0.5.0/src/lib_json/json_writer.cpp",
    ],
    hdrs = [
        "jsoncpp-src-0.5.0/src/lib_json/json_internalarray.inl",
        "jsoncpp-src-0.5.0/src/lib_json/json_internalmap.inl",
        "jsoncpp-src-0.5.0/src/lib_json/json_valueiterator.inl",
    ],
    defines = ["HAVE_A_OUT_H"],
    includes = [
        ".",
        "jsoncpp-src-0.5.0/include",
    ],
    linkstatic = 1,
    deps = [
        ":thingy",
    ],
)

cc_binary(
    name = "stackwalker",
    srcs = [
        "http_symbol_supplier.cc",
        "http_symbol_supplier.h",
        "stackwalker.cc",
    ],
    defines = [
        "HAVE_A_OUT_H",
        "__STDC_FORMAT_MACROS=1",
    ],
    includes = [
        ".",
        "jsoncpp-src-0.5.0/include",
    ],
    linkopts = [
        "-lcurl",
    ],
    linkstatic = 1,
    deps = [
        ":jsoncpp",
        ":thingy",
        "//vendor/breakpad/src:common",
        "//vendor/breakpad/src:common_inc",
        "//vendor/breakpad/src:processor",
    ],
)
