var fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

var express = require("express");
const path = require("path");
axios = require("axios");
const app = require("https-localhost")();
const uuidv4 = require("uuid").v4;
require("dotenv").config();

const cors = require("cors");

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
  // redirect to localhost:8080 on the browser

  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/app", function (req, res) {
  var code = req.query.code;
  get_token(code, res);
  // redirect to localhost:3000 on the browser
  res.redirect("https://localhost:3000");
});

app.get("/listBucket", function (req, res) {
  // get token from header
  var token = req.headers.authorization;
  //
  var bucketName = req.query.bucketName;

  list_bucket_files(res, bucketName, token);
});
app.get("/tiffToTarDZI", function (req, res) {
  var bucketName = req.query.bucketname;
  var file_name = req.query.filename;
  var token = req.headers.authorization;

  convert_tiff_to_tarDZI(bucketName, file_name, token, res);
  // res.send('done');
});
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.listen(port, ip, () => {});

app.get("/jobStatus", function (req, res) {
  var jobID = req.query.jobID;
  respondToJobPoll(jobID, res);
});
app.use(express.static(path.join(__dirname, "public")));

// function which lists all files in bucket
function list_bucket_files(res, bucketname, token) {
  requestURl = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketname}?limit=50&delimiter=/`;
  axios
    .get(requestURl, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    })
    .then(function (response) {
      // set response status to 200

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
    " -icr 0.1 -tf jpg  -o . & ";

  promise = exec(cmd, function (error, stdout, stderr) {});
  return promise;
}

// function which converts dzi to tar
function dzi_to_tar(dzi_folder) {
  var cmd = "tar -cvf " + dzi_folder + ".tar " + dzi_folder;
  // execute command and do not run asyncronously
  promise = exec(cmd, function (error, stdout, stderr) {});

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
      promise = exec(cmd, function (error, stdout, stderr) {});
    });
}

var RunningJobs = {};
function initJob() {
  // generate job id
  var jobID = uuidv4();
  // add job to running jobs
  RunningJobs[jobID] = {
    status: "running",
    progress: 0,
  };
  // return job id
  return jobID;
}
function updateJob(jobID, status, progress) {
  RunningJobs[jobID] = {
    status: status,
    progress: progress,
  };
}
function respondToJobPoll(jobID, res) {
  // check if job exists

  if (!RunningJobs[jobID]) {
    res.send({
      status: "does not exist",
      progress: 0,
    });
  } else {
    res.send(RunningJobs[jobID]);
  }
}

function GetDownloadLink(bucketName, file_name, token) {
  requestURL = `https://data-proxy.ebrains.eu/api/v1/buckets/${bucketName}/${file_name}?inline=false&redirect=false`;
  requestHeaders = {
    Authorization: token,
    "Content-Type": "application/json",
  };

  return axios.get(requestURL, {
    headers: requestHeaders,
  });
}

function curlFromBucket(target_url, file_name) {
  var cmd = `curl "${target_url}" -o "${file_name}"`;
  return exec(cmd, { maxBuffer: 1024 * 500 });
}
function DownloadFromBucket(bucketName, file_name, token, jobID) {
  updateJob(jobID, "Downloading file", 10);
  console.log("Downloading file");
  return GetDownloadLink(bucketName, file_name, token).then(function (
    response
  ) {
    return curlFromBucket(response.data.url, file_name);
  });
}

function createPyramid(file_name, jobID) {
  updateJob(jobID, "Converting to DZI", 30);
  console.log("Converting to DZI");
  var cmd = `java -jar pyramidio/pyramidio-cli-1.1.4.jar -i ${file_name} -icr 0.1 -tf jpg  -o . & `;
  return exec(cmd, { maxBuffer: 1024 * 500 });
}
function tarDZI(file_name, jobID) {
  updateJob(jobID, "Converting to tar", 70);
  console.log("Converting to tar");
  dzi_folder = file_name.split(".")[0] + "_files";
  var cmd = `tar -cf ${dzi_folder}.tar ${dzi_folder}`;
  return exec(cmd, { maxBuffer: 1024 * 500 });
}

function indexTar(file_name, jobID) {
  updateJob(jobID, "indexing tar", 80);
  console.log("indexing tar");
  stripped_file_name = file_name.split(".")[0];
  tar_name = stripped_file_name + "_files.tar";
  index_name = stripped_file_name + ".index";
  cmd = `python tarindexer.py -i ${tar_name} ${index_name}`;

  return exec(cmd, { maxBuffer: 1024 * 500 });
}
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

function curlToBucket(target_url, file_name) {
  var cmd = `curl -X PUT -T ${file_name} "${target_url}"`;
  return exec(cmd, { maxBuffer: 1024 * 500 });
}

function uploadToBucket(bucketName, file_name, token) {
  console.log("uploading to bucket");
  return getUploadLink(bucketName, file_name, token).then(function (response) {
    return curlToBucket(response.data.url, file_name);
  });
}

function uploadListToBucket(bucketName, file_list, token, jobID) {
  updateJob(jobID, "uploading tar", 90);
  return Promise.all(
    file_list.map(function (file_name) {
      return uploadToBucket(bucketName, file_name, token);
    })
  );
}

function convert_tiff_to_tarDZI(bucketName, fileName, token, res) {
  var jobID = initJob();
  res.send(jobID);
  var stripFileName = fileName.split(".")[0];
  var indexFile = `${stripFileName}.index`;
  var dziFile = `${stripFileName}.dzi`;
  var dziFolder = `${stripFileName}_files`;
  var dziTar = `${dziFolder}.tar`;
  var file_list = [indexFile, dziFile, dziTar];
  DownloadFromBucket(bucketName, fileName, token, jobID)
    .then(() => createPyramid(fileName, jobID))
    .then(() => tarDZI(fileName, jobID))
    .then(() => indexTar(fileName, jobID))
    .then(() => uploadListToBucket(bucketName, file_list, token))
    .then(() => updateJob(jobID, "Done", 100))
    .catch((error) => console.log(error));
}

// .catch(function (error) {
//     ;
//
// }
// );
// vsCode regex match all lines that start with console.log
// console.log\((.*)\)

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
    .catch(function (error) {});
}

var token_ = null;

function get_token(code, res) {
  var target_url =
    "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token";
  //

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "LocalDevelopmentServer",
    code: code,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: `${process.env.URL}/app`,
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

      res.status(error.response.status);
      res.send(error);
    });
}
