FROM debian:jessie
MAINTAINER Alexander Guettler <alexander@guettler.io>

VOLUME /build  
VOLUME /release

RUN apt-get update && apt-get -y install \  
    build-essential \
    devscripts \
    fakeroot \
    debhelper \
    automake \
    autotools-dev \
    pkg-config \
    git \
    ca-certificates \
    wget \
    curl \
    --no-install-recommends

RUN wget https://storage.googleapis.com/golang/go1.8.linux-amd64.tar.gz
RUN tar -xvf go1.8.linux-amd64.tar.gz
RUN mv go /usr/local
RUN export GOROOT=/usr/local/go
RUN export GOPATH=$HOME/glaucium-build
RUN export PATH=$GOPATH/bin:$GOROOT/bin:$PATH

RUN awk '$1 ~ "^deb" { $3 = $3 "-backports"; print; exit }' /etc/apt/sources.list > /etc/apt/sources.list.d/backports.list  
RUN echo "deb [arch=amd64] http://storage.googleapis.com/bazel-apt stable jdk1.8" | tee /etc/apt/sources.list.d/bazel.list
RUN curl https://bazel.build/bazel-release.pub.gpg | apt-key add -
RUN apt-get update
RUN apt-get -y -t jessie-backports install ca-certificates-java openjdk-8-jre-headless openjdk-8-jre openjdk-8-jdk
RUN apt-get update && apt-get -y install bazel

RUN apt-get -y install dh-systemd

RUN mkdir /build_files

COPY ./control /build_files/control
COPY ./rules /build_files/rules
COPY ./changelog /build_files/changelog
COPY ./compat /build_files/compat
COPY ./glaucium-webapp.service /build_files/glaucium-webapp.service
COPY ./glaucium-collector.service /build_files/glaucium-collector.service
COPY ./glaucium-processor.service /build_files/glaucium-processor.service
COPY ./glaucium.postinst /build_files/glaucium.postinst
COPY ./glaucium.preinst /build_files/glaucium.preinst
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]  