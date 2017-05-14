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
    srcs = [
        ":package-srcs",
    ],
    tags = ["automanaged"],
)

cc_library(
    name = "thingy",
    hdrs = glob(["**/*.h"]),
    includes = ["."],
)

cc_library(
    name = "jsoncpp",
    linkstatic = 1,
    includes = [".", 
        "jsoncpp-src-0.5.0/include"
    ],
    defines = ["HAVE_A_OUT_H"],
    deps = [
        ":thingy"
    ],
    hdrs = [
        "jsoncpp-src-0.5.0/src/lib_json/json_valueiterator.inl",
        "jsoncpp-src-0.5.0/src/lib_json/json_internalmap.inl",
        "jsoncpp-src-0.5.0/src/lib_json/json_internalarray.inl",
    ],
    srcs = [
        'jsoncpp-src-0.5.0/src/lib_json/json_reader.cpp',
        'jsoncpp-src-0.5.0/src/lib_json/json_writer.cpp',
        'jsoncpp-src-0.5.0/src/lib_json/json_value.cpp',
    ]
)


cc_binary(
    name = "stackwalker",
    linkstatic = 1,
    includes = [".", 
        "jsoncpp-src-0.5.0/include"
    ],
    defines = [
        "HAVE_A_OUT_H", 
        "__STDC_FORMAT_MACROS=1"
    ],
    deps = [
        "//vendor/breakpad/src:processor",
        "//vendor/breakpad/src:common",
        "//vendor/breakpad/src:common_inc",
        ":thingy",
        ":jsoncpp"
    ],
    srcs = [
      'http_symbol_supplier.cc',
      'http_symbol_supplier.h',
      'stackwalker.cc',
    ],
    linkopts = [                                                                
        "-lssl",                                                                
        "-lcrypto",
        "-lcurl",                                                            
    ],    
)