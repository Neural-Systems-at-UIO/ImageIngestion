mkdir runningJobs
# check if running in local or remote
if ["$env"]; then
    echo "local"
else   
    wget https://download.oracle.com/java/19/latest/jdk-19_linux-x64_bin.tar.gz   
    tar -xvf jdk-19_linux-x64_bin.tar.gz 
        # 
fi

