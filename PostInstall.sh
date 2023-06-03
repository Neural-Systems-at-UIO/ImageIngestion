mkdir runningJobs
# check if running in local or remote
if ["$env"]; then
    echo "local"
else 
    wget https://download.oracle.com/java/20/latest/jdk-20_linux-x64_bin.tar.gz
    tar -xvf jdk-19_linux-x64_bin.tar.gz 
    wget https://github.com/ImageMagick/ImageMagick/archive/refs/tags/7.0.8-12.tar.gz
    tar -xvf 7.0.8-12.tar.gz
    cd ImageMagick-7.0.8-12
    ./configure --prefix=$HOME/
    make
    make install

fi


