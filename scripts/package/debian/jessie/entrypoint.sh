#!/bin/bash
rm -rf /build/*  
rm -rf /release/*

git clone http://github.com/xforce/glaucium.git
cd glaucium
chmod +x build

mkdir -p /build/usr/bin
mkdir -p /usr/share/glaucium/webapp/data/dist

cd data/webapp
yarn install
yarn run build
cd ../../

cp -r data/webapp/dist/* /usr/share/glaucium/webapp/data/dist
mkdir -p /build/etc/glaucium
cp -r data/etc/glaucium/* /build/etc/glaucium/

mkdir -p debian

cp -r /build_files/* debian

./build

mv bazel-bin/cmd/webapp/webapp bazel-bin/cmd/webapp/glaucium-webapp
mv bazel-bin/cmd/collector/collector bazel-bin/cmd/collector/glaucium-collector
mv bazel-bin/cmd/processor/processor bazel-bin/cmd/processor/glaucium-processor

gbp dch -S -a --snapshot-number='os.popen("git log --pretty=oneline | wc -l").readlines()[0]'
debuild -us -uc

cp ../*.deb /build/