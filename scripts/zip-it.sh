#!/usr/bin/env bash

function cleanup_and_zip {
  # clean anything in the release directory
  rm -rf release/*

  # create the release directory if it doesn't exist
  mkdir -p release

  # zip the dist directory into our release directory
  zip -r -j release/obsidian-ai-research-assistant.zip dist
}

cleanup_and_zip
