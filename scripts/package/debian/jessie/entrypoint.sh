#!/bin/bash
rm -rf /build/*  
rm -rf /release/*

mkdir -p /build/collector
mkdir -p /build/processor
mkdir -p /build/webapp

mkdir -p /build/processor/etc/glaucium
mkdir -p /build/webapp/etc/glaucium
mkdir -p /build/processor/usr/bin/glaucium/breakpad/

mkdir -p /build/webapp/usr/bin
mkdir -p /build/processor/usr/bin
mkdir -p /build/collector/usr/bin

mkdir -p /build/webapp/usr/share/glaucium/webapp/data/dist

git clone http://github.com/xforce/glaucium.git
cd glaucium
chmod +x build

./build
cd data/webapp
yarn install
yarn run build
cd ../../

# Copy processor stuff
cp bazel-bin/cmd/processor/processor /build/processor/usr/bin/glaucium-processor
cp -r data/etc/glaucium/elastic_search_mapping.json /build/processor/etc/glaucium/elastic_search_mapping_processor.json
cp -r data/etc/glaucium/irrelevant_signature_re.txt /build/processor/etc/glaucium/
cp -r data/etc/glaucium/prefix_signature_re.txt /build/processor/etc/glaucium/
cp -r data/etc/glaucium/trim_dll_signature_re.txt /build/processor/etc/glaucium/
cp bazel-bin/vendor/minidump_stackwalk/stackwalker /build/processor/usr/bin/glaucium/breakpad/

# Copy webapp stuff
cp -r data/webapp/dist/* /build/webapp/usr/share/glaucium/webapp/data/dist
cp bazel-bin/cmd/webapp/webapp /build/webapp/usr/bin/glaucium-webapp
cp -r data/etc/glaucium/elastic_search_mapping.json /build/webapp/etc/glaucium/elastic_search_mapping_webapp.json

# Collector
cp bazel-bin/cmd/collector/collector /build/collector/usr/bin/glaucium-collector

cd /build
cd processor
fpm -t deb -v $(</glaucium/VERSION)~$(git --git-dir=/glaucium/.git --work-tree=/glaucium log --pretty=oneline | wc -l) -n glaucium-processor \
--deb-systemd /glaucium/scripts/package/debian/jessie/glaucium-processor.service \
--deb-user glaucium \
--deb-group glaucium \
-s dir .
cp *.deb ../
cd ..
cd webapp
fpm -t deb -v $(</glaucium/VERSION)~$(git --git-dir=/glaucium/.git --work-tree=/glaucium log --pretty=oneline | wc -l) -n glaucium-webapp \
--deb-systemd /glaucium/scripts/package/debian/jessie/glaucium-webapp.service \
--deb-user glaucium \
--deb-group glaucium \
-s dir .
cp *.deb ../
cd ..
cd collector
fpm -t deb -v $(</glaucium/VERSION)~$(git --git-dir=/glaucium/.git --work-tree=/glaucium log --pretty=oneline | wc -l) -n glaucium-collector \
--deb-systemd /glaucium/scripts/package/debian/jessie/glaucium-collector.service \
--deb-user glaucium \
--deb-group glaucium \
-s dir .
cp *.deb ../