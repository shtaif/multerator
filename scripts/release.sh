#!/bin/bash

standard-version $* &&
git push --follow-tags origin master &&
release &&
npm publish