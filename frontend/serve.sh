#!/bin/bash

source env.local

yarn vite serve --host 127.0.0.1 --port ${APP_PORT} $@
