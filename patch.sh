#!/bin/sh

cp ./patch/screen.js node_modules/blessed/lib/widgets/
cp ./patch/server.js node_modules/sqlectron-core/lib/validators/
cp ./patch/sqlserver.js node_modules/sqlectron-core/lib/db/clients/

