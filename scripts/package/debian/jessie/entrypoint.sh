#!/bin/bash
rm -rf /build/*  
rm -rf /release/*

git clone http://github.com/xforce/glaucium.git
cd glaucium
chmod +x build

mkdir -p /build/usr/bin
mkdir -p /usr/share/glaucium/webapp/data/

cp -r data/webapp/* /usr/share/glaucium/webapp/data/
mkdir -p /build/etc/glaucium
cp -r data/etc/glaucium/* /build/etc/glaucium/

mkdir -p debian

cp -r /build_files/* debian

./build

mv bazel-bin/cmd/webapp/webapp bazel-bin/cmd/webapp/glaucium-webapp
mv bazel-bin/cmd/collector/collector bazel-bin/cmd/collector/glaucium-collector
mv bazel-bin/cmd/processor/processor bazel-bin/cmd/processor/glaucium-processor

debuild -us -uc

mv ../*.deb /build/