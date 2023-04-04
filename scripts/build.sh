#!/bin/bash

build() {
    echo 'building react'

    rm -rf dist/*

    export INLINE_RUNTIME_CHUNK=false
    export GENERATE_SOURCEMAP=false
    export NODE_OPTIONS=--openssl-legacy-provider

    yarn craco build

    mkdir -p dist
    cp -r build/* dist

    mv dist/index.html dist/popup.html

    zip -r dist.zip dist/*
}

build
