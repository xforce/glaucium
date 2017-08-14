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

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get update && apt-get install -y nodejs
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get install -y yarn

RUN apt-get -y install ruby ruby-dev rubygems build-essential
RUN gem install --no-ri --no-rdoc fpm

RUN apt-get -y install dh-systemd
RUN apt-get -y install git-buildpackage
RUN apt-get -y install libcurl4-openssl-dev

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]  