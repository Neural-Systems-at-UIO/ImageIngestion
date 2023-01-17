var fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
// non promise version
const reg_exec = require('child_process').exec;
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const https = require('https');
// use express
var express = require('express');
const path = require('path');
const request = require('request');
axios = require('axios');
const app = require("https-localhost")()
require('dotenv').config();

// app.use(express.static(path.join(__dirname, "..", "build")));
// app.use(express.static("public"));

// enable CORS
const cors = require('cors');
// https

app.use(cors());
// enable https


// var token = null;
// set https 



// var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8888,
//     ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
// let users provide bucketurl as a parameter
app.get('/bucketurl/', (req, res) => {
    // const tarUrl = req.query.tarUrl;
    var bucket_url = req.query.bucketurl;
    // console.log(bucket_url);
    iterate_over_bucket_files(bucket_url);
    res.send('done');
}
);
app.get('/auth/', (req, res) => {

    var code = req.query.code;
    get_token(code, res);
}
);
// serve index.html
app.get('/', function (req, res) {
    // redirect to localhost:8080 on the browser
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/app', function (req, res) {
    var code = req.query.code;
    get_token(code, res);
    // redirect to localhost:3000 on the browser
    res.redirect('https://localhost:3000');
    // res.sendFile(path.join(__dirname + '/build/index.html'));
});


app.get('/listBucket', function (req, res) {
    // get token from header
    var token = req.headers.authorization;
    // console.log(req)
    console.log('received token', token);
    var bucket_name = req.query.bucketName;
    console.log('bucket name', bucket_name)
    list_bucket_files(res, bucket_name, token);
});

// function which lists all files in bucket
function list_bucket_files(res, bucketname, token) {
    requestURl = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketname}?limit=50&delimiter=/`;
    console.log('second token: ', token);
    axios.get(requestURl, {
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
        // set response status to 200
        console.log(response)
        res.status(response.status);
        // encode response data to json
        console.log(response.data)
        var data = JSON.stringify(response.data);
        res.send(data);

    }).catch(function (error) {
        console.log(error);
        res.status(error.response.status);
        res.send(error.response.data);
    });

}
app.get('/tiffToTarDZI', function (req, res) {
    var bucket_name = req.query.bucketname;
    var file_name = req.query.filename;
    var token = req.headers.authorization;
    console.log('bucket name', bucket_name)
    console.log('file name', file_name)
    console.log('token', token)
    convert_tiff_to_tarDZI(bucket_name, file_name, token);
    res.send('done');
});
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(port, ip, () => {
    console.log(`test Example app listening at http://localhost:${port}`)
}
);


app.use(express.static(path.join(__dirname, 'public')));

// use java cli tool pyramidio/pyramidio-cli.1.1.4.jar
// to convert image to dzi
function image_to_dzi(image) {
    // console.log('image', image)
    var cmd = 'java -jar pyramidio/pyramidio-cli-1.1.4.jar -i ' + image + ' -icr 0.1 -tf jpg  -o . & ';
    console.log(cmd)
    promise = exec(cmd, function (error, stdout, stderr) {
        console.log(error);
        console.log(stderr);
        console.log(stdout);
    });
    return promise;
}

// function which converts dzi to tar
function dzi_to_tar(dzi_folder) {
    var cmd = 'tar -cvf ' + dzi_folder + '.tar ' + dzi_folder;
    // execute command and do not run asyncronously
    promise = exec(cmd, function (error, stdout, stderr) {
        console.log(error);
        console.log(stderr);
        console.log(stdout);
    });

    return promise;
}
function curl_and_save(bucket_name, file_name) {
    // split url to get filename

    requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucket_name}/${file_name}?inline=false&redirect=false`
    console.log('requestURL', requestURL)
    promise = axios.get(requestURL, {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    }).then(function (response) {


        var cmd = `curl "${response.data.url}" -o "${file_name}"`;
        // console.log(cmd);
        promise = exec(cmd, function (error, stdout, stderr) {
            console.log(stdout);
            console.log(error);
            console.log(stderr);

        });
    });

}


function convert_tiff_to_tarDZI(bucket_name, file_name, token) {
    // console.log(token)
    // download tiff file at url
    requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucket_name}/${file_name}?inline=false&redirect=false`
    console.log('requestURL', requestURL)
    requestHeaders = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }
    console.log('requestHeaders', requestHeaders)
    promise = axios.get(requestURL, {
        headers: requestHeaders
    }).then(function (response) {
        // multi line string

        console.log('\n\n\n\nresponse\n\n\n\n')
        console.log(response.data.url);

        var cmd = `curl "${response.data.url}" -o "${file_name}"`;
        console.log(cmd);
        exec(cmd, { maxBuffer: 1024 * 500 }).then(function () {
            console.log('downloaded file');
            var cmd = `java -jar pyramidio/pyramidio-cli-1.1.4.jar -i ${file_name} -icr 0.1 -tf jpg  -o . & `;
            console.log(cmd)
            exec(cmd, { maxBuffer: 1024 * 500 }).then(function () {
                console.log('converted to dzi');
                dzi_folder = file_name.split('.')[0] + '_files';
                var cmd = `tar -cf ${dzi_folder}.tar ${dzi_folder}`;
                // execute command and do not run asyncronously
                exec(cmd, { maxBuffer: 1024 * 500 }).then(function () {
                    cmd = `python tarindexer.py -i ${dzi_folder}.tar ${file_name.split('.')[0]}.index`;
                    exec(cmd, { maxBuffer: 1024 * 500 }).then(function () {
                        // post index file to bucket
                        api_url = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucket_name}/${file_name.split('.')[0]}.index`
                        console.log('api_url', api_url)
                        // i need to make a put request to the api_url
                        // with the index file as the body
                        // and the token as the header

                        // console.log('Bearer ' + token)
                        // make a put request to the api_url
                        var headers = {
                            'Authorization':  token,
                            'Content-Type': 'application/json'
                        }
                        console.log(headers)
                        axios.put(api_url, {}, {
                            headers : headers
                        }).then(function (response) {
                            destination = response.data.url
                            // upload index file to destination
                            console.log('starting curl PUT')
                            cmd = `curl -X PUT -T "${file_name.split('.')[0]}.index" "${destination}"`;
                            console.log('finishing curl PUT');
                            exec(cmd, { maxBuffer: 1024 * 500 }).then(function () {
                                new_url = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucket_name}/${file_name.split('.')[0]}_files.tar`
                                console.log('starting axios put')
                                axios.put(new_url, {}, {
                                    headers: {
                                        'Authorization': token,
                                        'Content-Type': 'application/json'
                                    }
                                })
                                    .then(function (response) {
                                        console.log('finishing axios put')
                                        destination = response.data.url
                                        // upload index file to destination
                                        cmd = `curl -X PUT -T "${dzi_folder}.tar" "${destination}"`;
                                        console.log('here')
                                        console.log(cmd)
                                        exec(cmd)
                                        viewer_link = `https://data-proxy.ebrains.eu/api/v1/public/buckets/${bucket_name}/${file_name.split('.')[0]}.index`
                                        console.log('viewer_link', viewer_link)
                                    }).catch(function (error) {
                                        console.log(error);
                                        console.log('problem...')
                            });




                        }
                        ).catch(function (error) {
                            console.log(error);
                            console.log('problem...')
                        }
                        );
                    }

                    )
                    console.log('converted to tar');
                });
            }
            );
            console.log('does this even run?')
        });
        console.log('or this?')
    })
    console.log('what about this?')
});
}



function iterate_over_bucket_files(bucketname, folder_name) {
    var requestURl = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketname}/${folder_name}?inline=false&redirect=true`;
    // fetch list of files from bucket

    fetch(requestURl)
        .then((resp) => resp.json())
        .then(function (data) {
            // get keys from data
            data = data['objects'];
            for (var i = 0; i < data.length; i++) {
                var name = data[i]['name'];
                var file_url = `${folder_url}/${name}`;
                console.log(file_url)
                // download file
                split_name = name.split('/');
                var file_name = split_name[split_name.length - 1];
                console.log(file_name)
                curl_and_save(file_url, file_name)
                // convert image to dzi
                image_to_dzi(file_name)
                // convert dzi to tar
                dzi_folder = `${file_name.split('.')[0]}_files`;
                dzi_to_tar(dzi_folder);
            }
        }).catch(function (error) {
            console.log(error);
        });


}











var token_ = null



function get_token(code, res) {
    var target_url = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token";
    // console.log('client_secret', process.env.CLIENT_SECRET)
    const params = new URLSearchParams({
        'grant_type': 'authorization_code',
        'client_id': 'LocalDevelopmentServer',
        'code': code,
        'client_secret': process.env.CLIENT_SECRET,
        'redirect_uri': 'https://127.00.0.1:8080/app'

    });

    console.log('params', params)
    // make POST request to get token
    axios({
        method: 'post',
        url: target_url,
        data: params.toString(),
        config: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    }).then(response => {
        // send token to client
        // console.log(response)
        token_ = response.data['access_token'];
        console.log('retrieved token', token_)
        // set status to 200
        res.status(response.status);
        console.log(response.status)

        res.send(token_);
    }).catch(error => {
        // console.log(error);
        console.log('error token')
        res.status(error.response.status);
        res.send(error);
    });

}


