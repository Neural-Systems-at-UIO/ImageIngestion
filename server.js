var fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);



// remove all console.logs with this regex
// console.log\((.*)\)

// import fetch in old node
const fetch = require("node-fetch")
// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));

var express = require("express");
const path = require("path");
const axios = require("axios");
const execSync = require("child_process").execSync;
if (process.env.NODE_ENV === "production") {
  var app = express();
}
else {
  var app = require("https-localhost")();
  // var app = express();
}


const uuidv4 = require("uuid").v4;
require("dotenv").config();

const cors = require("cors");




// imports for the webSocket
const WebSocketServer = require('ws');
const http = require('http');

const server = http.createServer();
const WebSocket = require('ws');


// reverse proxy so that the webSocket can be accessed on the same port as the server
const { createProxyMiddleware } = require('http-proxy-middleware');
const { put } = require("request");

// use create proxy middleware to create a proxy to the webSocket server
const wsProxy = createProxyMiddleware({ target: 'ws://localhost:8083', ws: true, changeOrigin: true });
app.use('/ws', wsProxy);


var wss = new WebSocket.Server({
  port: 8083
})




console.log('begin options..........')

console.log(wss.options)

console.log('end options..........')






app.use(cors());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0";
// let users provide bucketurl as a parameter
app.get("/bucketurl/", (req, res) => {
  // const tarUrl = req.query.tarUrl;
  var bucket_url = req.query.bucketurl;
  // ;
  iterate_over_bucket_files(bucket_url);
  res.send("done");
});

app.get("/auth/", (req, res) => {

  var code = req.query.code;

  get_token(code, res);
});
// serve index.html
app.get("/", function (req, res) {
  // get clb-bucket-id from the url
  // redirect to localhost:8080 on the browser
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname + "/index_prod.html"));
  }
  else if (process.env.NODE_ENV === "development") {
    res.sendFile(path.join(__dirname + "/index_dev.html"));
  }

});



function GetUser(token) {
  // console.log('trying with token: ' + token)
  return new Promise((resolve, reject) => {
    requestURL = `https://core.kg.ebrains.eu/v3/users/me`;
    axios.get(requestURL, {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(function (result) {
        resolve(result);
      })
      .catch(function (error) {
        // ;
        console.log(error)
        reject(error);
      }
      );
  })

}



app.get("/getuser", function (req, res) {
  // get token from header

  var token = req.headers.authorization;
  GetUser(token).then(
    function (result) {


      res.send(result.data);
    }
  )
    .catch(function (error) {
      // ;
      // console.log(error)

    });
});
function GetUserRoles(token) {
  requestURL = `https://core.kg.ebrains.eu/v3/users/me/roles`;
  return axios.get(requestURL, {
    headers: {
      Authorization: `${token}`,
      "Content-Type": "application/json",
    },
  })


}

app.get("/getuserroles", function (req, res) {
  // get token from header

  var token = req.headers.authorization;

  GetUserRoles(token).then(
    function (result) {
      var finalColabs = [];

      var userRoles = result.data.data.userRoles;
      // get the keys from the user roles
      var keys = Object.keys(userRoles);


      for (var i = 0; i < userRoles.length; i++) {
        var userRole = userRoles[i];
        // split on :
        var splitUserRole = userRole.split(":");
        var collabName = splitUserRole[0];
        var roleName = splitUserRole[1];
        if (roleName == "owner") {
          // split collab name on the first -
          var splitCollabName = collabName.split("-");
          var collabID = splitCollabName[0];
          // join the rest of the collab name
          var collabName = splitCollabName.slice(1).join("-");
          if (collabID == "collab") {
            finalColabs.push(collabName);
          }
        }
      }
      res.send(finalColabs);

    }
  )
    .catch(function (error) {
      ;
    })
    ;


});
app.get("/app", function (req, res) {


  // 
  if (process.env.NODE_ENV === "production") {


    // edit the current url without redirect
    res.sendFile(path.join(__dirname, "build", "index.html"));
  } else {
    // redirect to localhost:8080 on the browser
    // get_token(req.query.code, res);


    // attach the query parameters to the url
    res.redirect("https://localhost:8081" + req.url);
  }
});








app.get("/listBucket", function (req, res) {
  // get token from header

  var token = req.headers.authorization;
  //
  var bucketName = req.query.bucketName;
  var folderName = req.query.folderName;

  list_bucket_files(res, bucketName, folderName, token);
});

app.get("/tiffToTarDZI", function (req, res) {
  var bucketName = req.query.bucketname;
  var file_name = req.query.filename;
  var token = req.headers.authorization;
  convert_tiff_to_tarDZI(bucketName, file_name, token, res);
  res.send('done');
});

app.get("/tiffListToTarDZI", function (req, res) {
  var bucketName = req.query.bucketname;
  var file_list = req.query.filelist;
  file_list = file_list.split(",");
  var brainID = req.query.brainID;
  var token = req.headers.authorization;
  var folder_name = req.query.folderName;
  console.log('folder_name', folder_name)


  // 
  convert_list_of_tiffs_to_tarDZI(bucketName, file_list, token, brainID, res, folder_name);
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(express.static("build"));
const final_server = app.listen(port, ip, () => { });

if (process.env.NODE_ENV === "production") {
  final_server.on('upgrade', wsProxy.upgrade); // <-- subscribe to http 'upgrade'
}

app.get("/jobStatus", function (req, res) {
  var jobID = req.query.jobID;
  var token = req.headers.authorization;
  var bucket_name = req.query.bucketName;
  respondToJobPoll(jobID, token, bucket_name, res);
});

app.get("/checkForRunningJobs", function (req, res) {
  var bucketName = req.query.bucketName;
  checkForRunningJobsFromBucket(bucketName, res)

})

app.use(express.static(path.join(__dirname, "public")));

// function which lists all files in bucket
function list_bucket_files(res, bucketname, folderName, token) {



  requestURl = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketname}?prefix=${folderName}&limit=5000&delimiter=/`;
  // 
  axios
    .get(requestURl, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    })
    .then(function (response) {
      // set response status to 200
      // 
      res.status(response.status);
      // encode response data to json

      var data = JSON.stringify(response.data);
      res.send(data);
    })
    .catch(function (error) {

      res.status(error.response.status);
      res.send(error.response.data);
    });
}

// use java cli tool pyramidio/pyramidio-cli.1.1.4.jar
// to convert image to dzi
function image_to_dzi(image) {
  //
  var cmd =
    "java -jar pyramidio/pyramidio-cli-1.1.4.jar -i " +
    image +
    " -tf png  -o . & ";

  promise = exec(cmd, function (error, stdout, stderr) { });
  return promise;
}

// function which converts dzi to tar
function dzi_to_tar(dzi_folder) {
  var cmd = "tar -cvf " + dzi_folder + ".tar " + dzi_folder;
  // execute command and do not run asyncronously
  promise = exec(cmd, function (error, stdout, stderr) { });

  return promise;
}
function curl_and_save(bucketName, file_name) {
  // split url to get filename

  requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}/${file_name}?inline=false&redirect=false`;

  promise = axios
    .get(requestURL, {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    })
    .then(function (response) {
      var cmd = `curl "${response.data.url}" -o "${file_name}"`;
      // ;
      promise = exec(cmd, function (error, stdout, stderr) { });
    })
    .catch(function (error) {
      ;
    })
    ;
}



wss.on('connection', function connection(ws) {
  console.log('connected')
  var message = JSON.stringify({ message: 'connected' });
  console.log('sending.................................................')

  ws.send(message);

  console.log('connected');
  // ws.userID = req.query.userID;
  // console.log('connected uuid: ' + ws.userID);
  ws.on('message', function incoming(message) {
    console.log('------------------------------------')
    console.log('received: %s', message);
    console.log('------------------------------------')

    var message = JSON.parse(message);
    // check is user key is in message
    if (message.user) {

      // console.log(message.user)
      // console.log('----')
      // console.log(message.user)
      ws.userID = message.user["https://schema.hbp.eu/users/nativeId"];
      ws.userName = message.user["http://schema.org/name"];
    }
    if (message.CurrentBucket) {
      ws.CurrentBucket = message.CurrentBucket;
    }
    if (message.CurrentJob) {
      ws.CurrentJob = message.CurrentJob;
      ws.KeyPath = message.KeyPath;
    }
    // log all connected users
    // console.log('connected users: ');
    // wss.clients.forEach(function each(client) {
    //   console.log('------------------')
    //   console.log(client.userID);
    //   console.log(client.userName);
    // }
    // );

  });

});

server.listen('8082', function listening() {
  ;
});

// end of websocket server







var RunningJobs = {};
function initJob(total_images, bucket_name, brainID) {
  // generate job id
  var jobID = uuidv4();
  // create a job folder within the runningJobs folder


  // add job to running jobs
  RunningJobs[jobID] = {
    current_image: 0,
    total_images: total_images,
    status: "running",
    progress: 0,
    bucket_name: bucket_name,
    brainID: brainID,
    jobID: jobID
  };
  // return job id
  return jobID;
}
function updateJob(jobID, status, progress) {
  console.log('updating with status: ' + status)
  RunningJobs[jobID].status = status;
  RunningJobs[jobID].progress = progress;
  if (status == 'Done') {
    RunningJobs[jobID]["current_image"] += 1;
  }

  console.log('updateJob', RunningJobs[jobID])
  wss.clients.forEach(function each(client) {
    console.log('------------------')
    console.log(client.CurrentBucket);
    console.log(RunningJobs[jobID].bucket_name);
    if (client.CurrentBucket == RunningJobs[jobID].bucket_name) {
      // console.log('client', client)
      console.log('sending.................................................')
      client.send(JSON.stringify({ "JobUpdate": RunningJobs[jobID], "CurrentJob": client.CurrentJob }));
    }
  });



}
function getFinishedJobsFromBucket(bucketName, token) {

}




function checkForRunningJobsFromBucket(bucketName, res) {


  // use map to see if there are any running jobs from the bucket
  runningJobsFromBucket = {}
  for (var jobID in RunningJobs) {


    if (RunningJobs[jobID].bucket_name == bucketName) {
      runningJobsFromBucket[jobID] = RunningJobs[jobID]

    }
  }

  // create a new objecty wtih only the running jobs from the bucket

  // if there are running jobs from the bucket, return the job id

  if (Object.keys(runningJobsFromBucket).length > 0) {

    res.send(runningJobsFromBucket);
  }
  // if there are no running jobs from the bucket, return false
  else {
    res.send(false);
  };
}

function ReadJobMetadata(bucketName, brainID, token, res) {
  GetDownloadLink(bucketName, '.nesysWorkflowFiles/Metadata/' + brainID + ".json", token, "")
    .then(function (response) {
      // load json from response.data.url with fetch
      console.log('url: ' + response.data.url)
      fetch(response.data.url)

        .then((response) => {

          return response.json()
        })
        .then((json) => {
          console.log(json)
          var return_json = {
            status: "Done",
            progress: 100,
            jobID: json.jobID,
            bucket_name: bucketName,
            brainID: brainID,
            current_image: Object.keys(json.file_list).length,
            total_images: Object.keys(json.file_list).length,
          }
          res.send(return_json);
        })
        .catch((error) => {
          console.log('error: ' + error)
        });
    })
}


function respondToJobPoll(jobID, token, bucket_name, res) {
  // check if job exists

  if (!RunningJobs[jobID]) {
    ReadJobMetadata(bucket_name, jobID, token, res)
    // res.send({
    //   status: "does not exist",
    //   progress: 0,
    // });
  } else {
    res.send(RunningJobs[jobID]);
  }
}

function GetDownloadLink(bucketName, file_name, token, folder_name) {
  requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}/${folder_name}${file_name}?inline=false&redirect=false`;
  requestHeaders = {
    Authorization: token,
    "Content-Type": "application/json",
  };
  console.log('getting download link')
  console.log(requestURL)
  console.log(requestHeaders)

  return axios.get(requestURL, {
    headers: requestHeaders,
  });
}

function curlFromBucket(target_url, file_name, jobID) {
  // remove extension from file name
  strip_file_name = file_name.split(".")[0];
  // create folder for image in running jobs/jobId folder
  var cmd = `curl "${target_url}" -o "runningJobs/${jobID}/${strip_file_name}/${file_name}"`;
  console.log(cmd)
  console.log('executing curl')
  return exec(cmd, { maxBuffer: 1024 * 500 });

}


function copyFileInBucket(bucket_name, file_name, new_file_name, token) {
  requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucket_name}/${file_name}/copy?name=${new_file_name}`;
  requestHeaders = {
    Authorization: token,
    "Content-Type": "application/json",
  };

  return axios.put(requestURL, {}, {
    headers: requestHeaders,
  });
}

function DownloadFromBucket(bucketName, file_name, token, jobID, folder_name) {
  updateJob(jobID, "Downloading file", 10);
  console.log("downloading file with token: " + token + "from bucket: " + bucketName + " and file: " + file_name + "")
  return GetDownloadLink(bucketName, file_name, token, folder_name).then(function (
    response
  ) {
    console.log('now we curl from bucket')
    return curlFromBucket(response.data.url, file_name, jobID);
  });
}
function createPyramid(file_name, jobID) {
  updateJob(jobID, "Converting to DZI", 30);
  // check if file has a opacity channel
  // if it does use png output



  strip_file_name = file_name.split(".")[0];
  var cmd = `./magick identify -format "%[channels]" runningJobs/${jobID}/${strip_file_name}/${file}`;
  var numChannels = execSync(cmd).toString().trim();
  if (numChannels == "srgba") {
    var cmd = `${process.env.java} -jar pyramidio/pyramidio-cli-1.1.5.jar -i runningJobs/${jobID}/${strip_file_name}/${file_name} -tf png  -icr 0.01 -o runningJobs/${jobID}/${strip_file_name}/ & `;
  } else {
    var cmd = `${process.env.java} -jar pyramidio/pyramidio-cli-1.1.5.jar -i runningJobs/${jobID}/${strip_file_name}/${file_name} -tf jpg  -icr 0.01 -o runningJobs/${jobID}/${strip_file_name}/ & `;
  }
  console.log(cmd)
  return exec(cmd, { maxBuffer: 1024 * 500 });
}
function tarDZI(file_name, jobID) {
  updateJob(jobID, "Converting to tar", 70);

  dzi_folder = file_name.split(".")[0] + "_files";
  strip_file_name = file_name.split(".")[0];

  var cmd = `tar -cf runningJobs/${jobID}/${strip_file_name}/${dzi_folder}.tar runningJobs/${jobID}/${strip_file_name}/${dzi_folder}`;
  return exec(cmd, { maxBuffer: 1024 * 500 });
}

function indexTar(file_name, jobID) {
  updateJob(jobID, "indexing tar", 80);

  stripped_file_name = file_name.split(".")[0];
  tar_name = stripped_file_name + "_files.tar";
  index_name = stripped_file_name + ".index";
  cmd = `python tarindexer.py -i runningJobs/${jobID}/${strip_file_name}/${tar_name} runningJobs/${jobID}/${strip_file_name}/${index_name}`;

  return exec(cmd, { maxBuffer: 1024 * 500 });



}
// function InitialiseBucketWorkFlowFolder(bucket_name, token) {
//   var requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucket_name}/.nesysWorkflowFiles`;
//   var headers = {
//     Authorization: token,
//     "Content-Type": "application/json",
//   };
// }


function getUploadLink(bucketName, file_name, token) {
  requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}/${file_name}`;
  var headers = {
    Authorization: token,
    "Content-Type": "application/json",
  };

  return axios.put(
    requestURL,
    {},
    {
      headers: headers,
    }
  );
}


// app.get("/getUploadLink", function (req, res) {
//   var bucketName = req.query.bucketName;
//   var file_name = req.query.file_name;
//   var token = req.headers.authorization;
//   getUploadLink(bucketName, file_name, token).then(function (response) {
//     res.send(response.data);
//   });
// });





function curlToBucket(target_url, file_name, jobID, proj_file) {
  // save output to runningJobs folder
  console.log('curling to bucket')
  console.log(target_url)
  console.log(file_name)
  console.log(jobID)
  strip_file_name = file_name.split(".")[0];
  if (proj_file) {

    var cmd = `curl -X PUT -T runningJobs/${jobID}/${file_name} "${target_url}"`;

  } else {


    var cmd = `curl -X PUT -T runningJobs/${jobID}/${strip_file_name}/${file_name} "${target_url}"`;
  }
  console.log(cmd)
  return exec(cmd, { maxBuffer: 1024 * 500 });
}

function uploadToBucket(bucketName, file_name, token, jobID, proj_file) {
  console.log('uploading to bucket')
  console.log(bucketName)
  console.log(file_name)
  return getUploadLink(bucketName, file_name, token).then(function (response) {
    return curlToBucket(response.data.url, file_name, jobID, proj_file);
  })
    .catch(function (error) {
      console.log('this failed')
      console.log(error)
        ;
    })
    ;
}

function uploadListToBucket(bucketName, file_list, token, jobID) {
  updateJob(jobID, "Uploading to bucket", 80);
  return Promise.all(
    file_list.map(function (file_name) {
      return uploadToBucket(bucketName, file_name, token, jobID, false);
    })
  );
}

function createJobDir(jobID, file_list) {
  // check if job folder exists
  if (!fs.existsSync(`runningJobs/${jobID}`)) {
    fs.mkdirSync(`runningJobs/${jobID}`);
    for (i in file_list) {
      file = file_list[i];
      var strip_file_name = file.split(".")[0];
      fs.mkdirSync(`runningJobs/${jobID}/${strip_file_name}`);
    }
  }
}

function zipDZI(filename, jobID) {
  updateJob(jobID, "Zipping output", 70);
  // use STORED method to avoid compression
  var strip_file_name = filename.split(".")[0];
  // only zip the dzi folder
  var list_to_zip = [`${strip_file_name}_files`, `${strip_file_name}.dzi`];
  // write multiline command which first changes directory to the folder to be zipped, then zips the folder and then changes back to the original directory
  var cmd = `cd runningJobs/${jobID}/${strip_file_name} && ../../../zip -q -0 -r ${strip_file_name}.dzip ${list_to_zip.join(" ")} && cd ../../..`;

  return exec(cmd, { maxBuffer: 1024 * 500 });
}

function writeEmptyFile(filename, jobID) {
  var strip_file_name = filename.split(".")[0];
  var cmd = `touch runningJobs/${jobID}/${filename}`;
  return exec(cmd, { maxBuffer: 1024 * 500 });
}

function convert_tiff_to_tarDZI(bucketName, fileName, token, jobID, folder_name) {
  return new Promise(function (resolve, reject) {
    var stripFileName = fileName.split(".")[0];
    var indexFile = `${stripFileName}.index`;
    var dziFile = `${stripFileName}.dzi`;
    var dziFolder = `${stripFileName}_files`;
    var dziTar = `${dziFolder}.tar`;
    var dziZip = `${stripFileName}.dzip`;
    var file_list = [dziZip];
    var fileNameNoPath = fileName.split("/").pop();
    DownloadFromBucket(bucketName, fileName, token, jobID, folder_name)
      .then(() => createPyramid(fileName, jobID))
      .then(() => zipDZI(fileName, jobID))
      // .then(() => indexTar(fileName, jobID))
      .then(() => uploadListToBucket(`${bucketName}/.nesysWorkflowFiles/zippedPyramids/${RunningJobs[jobID].brainID}/`, file_list, token, jobID))
      .then(() => updateJob(jobID, "Done", 100))
      .then(() => resolve())
      .catch((error) => {
        // 
        console.log(error)
        updateJob(jobID, "Error", 0);
        ;
        reject(error);
      });
    copyFileInBucket(bucketName, fileName, `.nesysWorkflowFiles/originalImages/${RunningJobs[jobID].brainID}/${fileNameNoPath}`, token)
  });
}

function createJobMetadata(jobID, bucketName, brainID, file_list, token) {

  GetUser(token).then(function (response) {


    var jobMetadata = {
      jobID: jobID,
      bucketName: bucketName,
      brainID: brainID,
      alternateName: response.data.data['http://schema.org/alternateName'],
      email: response.data.data['http://schema.org/email'],
      familyName: response.data.data['http://schema.org/familyName'],
      givenName: response.data.data['http://schema.org/givenName'],
      nativeID: response.data.data['http://schema.org/nativeID'],
      creationTime: new Date().toISOString(),

      file_list: {

      }
    };

    for (i in file_list) {
      file = file_list[i];
      // print the present working directory
      jobMetadata.file_list[file] = {};
    }
    RunningJobs[jobID]['jobMetadata'] = jobMetadata;
  })
    .catch(function (error) {
      console.log("Error in createJobMetadata")
      console.log(error)
        ;
    })
    ;
}

function updateJobMetadata(jobID, file_list, jobMetadata, token) {
  for (i in file_list) {
    file = file_list[i];
    console.log('-------------------------------------')
    console.log("file: " + file);
    var cmd = `pwd`;
    var pwd = execSync(cmd).toString().trim();

    // get image resolution
    var strip_file_name = file.split(".")[0];
    // get image width, note that file could be .jpg .png .tif, etc
    var cmd = `./magick identify -format "%w" runningJobs/${jobID}/${strip_file_name}/${file}`;
    var imageWidth = execSync(cmd).toString().trim();
    // get image height
    var cmd = `./magick identify -format "%h" runningJobs/${jobID}/${strip_file_name}/${file}`;
    var imageHeight = execSync(cmd).toString().trim();
    // get file size
    var cmd = `du -h runningJobs/${jobID}/${strip_file_name}/${file} | cut -f1`;
    var fileSize = execSync(cmd).toString().trim();
    // get number of channels
    var cmd = `./magick identify -format "%[channels]" runningJobs/${jobID}/${strip_file_name}/${file}`;
    var numChannels = execSync(cmd).toString().trim();

    // get bit depth
    var cmd = `./magick identify -format "%[depth]" runningJobs/${jobID}/${strip_file_name}/${file}`;
    var bitDepth = execSync(cmd).toString().trim();

    // get image extension
    var imageExtension = file.split(".")[1];

    // print the present working directory
    jobMetadata.file_list[file] = {
      imageWidth: imageWidth,
      imageHeight: imageHeight,
      fileSize: fileSize,
      imageExtension: imageExtension,
      channelFormat: numChannels,
      bitDepth: bitDepth
    };

  }
  RunningJobs[jobID].jobMetadata = jobMetadata;


  saveJobMetaData(jobID, token);

}

function saveJobMetaData(jobID, token) {
  var jobMetadata = RunningJobs[jobID].jobMetadata;
  var jobMetadataString = JSON.stringify(jobMetadata);

  var fileName = jobMetadata.brainID;
  var strip_file_name = fileName.split(".")[0];
  var jobMetadataFile = `${strip_file_name}.json`;
  fs.writeFileSync(`runningJobs/${jobID}/${jobMetadataFile}`, jobMetadataString);
  fs.writeFileSync(`runningJobs/${jobID}/${strip_file_name}.waln`, { 'atlas': 'mouse' });
  // upload jobMetadata.json to bucket
  var target_bucket = `${jobMetadata.bucketName}/.nesysWorkflowFiles/Metadata/`
  console.log(jobMetadataFile)
  console.log(`${strip_file_name}.waln`)
  uploadToBucket(target_bucket, jobMetadataFile, token, jobID, true);
  var target_bucket = `${jobMetadata.bucketName}/.nesysWorkflowFiles/alignmentJsons/`
  uploadToBucket(target_bucket, `${strip_file_name}.waln`, token, jobID, true);
  if (RunningJobs[jobID]['current_image'] == RunningJobs[jobID]['total_images']) {

    delete RunningJobs[jobID]
  }

}
async function convert_list_of_tiffs_to_tarDZI(
  bucketName,
  file_list,
  token,
  brainID,
  res,
  folder_name
) {
  file_list_length = file_list.length;
  var jobID = initJob((total_images = file_list_length), bucketName, brainID);
  createJobDir(jobID, file_list);
  res.send(jobID);
  createJobMetadata(jobID, bucketName, brainID, file_list, token)
  // loop through list of files and after the previous promise is resolved, start the next one
  for (var i = 0; i < file_list_length; i++) {
    var file_name = file_list[i];
    await convert_tiff_to_tarDZI(bucketName, file_name, token, jobID, folder_name);
    // 
    // updateJob(jobID, 'Done', 100) 

  }

  updateJobMetadata(jobID, file_list, RunningJobs[jobID].jobMetadata, token)


}

function iterate_over_bucket_files(bucketname, folder_name) {
  var requestURl = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketname}/${folder_name}?inline=false&redirect=true`;
  // fetch list of files from bucket

  fetch(requestURl)
    .then((resp) => resp.json())
    .then(function (data) {
      // get keys from data
      data = data["objects"];
      for (var i = 0; i < data.length; i++) {
        var name = data[i]["name"];
        var file_url = `${folder_url}/${name}`;

        // download file
        split_name = name.split("/");
        var file_name = split_name[split_name.length - 1];

        curl_and_save(file_url, file_name);
        // convert image to dzi
        image_to_dzi(file_name);
        // convert dzi to tar
        dzi_folder = `${file_name.split(".")[0]}_files`;
        dzi_to_tar(dzi_folder);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}





var token_ = null;

function get_token(code, res) {

  var target_url =
    "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token";
  //
  if (process.env.NODE_ENV === "production") {
    redirect_uri = process.env.REACT_APP_PROD_URL;
  }
  else if (process.env.NODE_ENV === "development") {
    redirect_uri = process.env.REACT_APP_DEV_URL;
  }
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.CLIENT_ID,
    code: code,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: `${redirect_uri}/app`,
  });

  // make POST request to get token
  axios({
    method: "post",
    url: target_url,
    data: params.toString(),
    config: {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  })
    .then((response) => {
      // send token to client
      //
      token_ = response.data["access_token"];

      // set status to 200
      res.status(response.status);

      res.send(token_);
    })
    .catch((error) => {
      // ;
      // 
      console.log(error)
      // ;
      res.status(error.response.status);
      res.send(error);
    });


}


