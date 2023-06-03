wget https://nodejs.org/download/release/v17.7.1/node-v17.7.1-linux-x64.tar.gz
tar -xzf node-v17.7.1-linux-x64.tar.gz
export node="/opt/app-root/src/node-v17.7.1-linux-x64/bin/node"
export npm="/opt/app-root/src/node-v17.7.1-linux-x64/bin/npm"
export corepack="/opt/app-root/src/node-v17.7.1-linux-x64/bin/corepack"
export npx="/opt/app-root/src/node-v17.7.1-linux-x64/bin/npx"

export NODEJS_HOME= "/opt/app-root/src/node-v17.7.1-linux-x64/"
export PATH=$PATH:$NODEJS_HOME/bin
