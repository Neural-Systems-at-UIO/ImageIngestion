mkdir runningJobs
# check if running in local or remote
if ["$env"]; then
    echo "local"
else 
    wget https://github.com/ImageMagick/ImageMagick/archive/refs/tags/7.1.0-61.tar.gz
    tar -xvf 7.1.0-61.tar.gz
    cd ImageMagick-7.1.0-61
    ./configure
    make
    make install
fi

# else   
#     wget https://download.oracle.com/java/19/latest/jdk-19_linux-x64_bin.tar.gz   
#     tar -xvf jdk-19_linux-x64_bin.tar.gz 
#     wget https://imagemagick.org/archive/binaries/magick --no-check-certificate
#         # 
# fi

