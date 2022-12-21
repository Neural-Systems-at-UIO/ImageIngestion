import { setChonkyDefaults } from "chonky";
import { ChonkyIconFA } from "chonky-icon-fontawesome";
import { FullFileBrowser, ChonkyActions } from "chonky";
import logo from "./logo.svg";
import { Progress, Space } from "antd";
import "./App.css";
import React, { useEffect, useState } from "react";
// import Button from '@material-ui/core/Button';
import {
  FileBrowser,
  FileContextMenu,
  FileList,
  FileNavbar,
  FileToolbar,
} from "chonky";

import { defineFileAction, FileData } from "chonky";
import { Nullable } from "tsdef";

var token = null;

const SortFilesBySize = defineFileAction({
  id: "GenerateBrain",
  requiresSelection: true,

  button: {
    name: "Generate Brain from Files",
    toolbar: true,
  },
});
// Somewhere in your `index.ts`:
setChonkyDefaults({ iconComponent: ChonkyIconFA });

const myEmojiMap = {
  bentoEmoji: "🍱",
  angryEmoji: "😠",
  japanEmoji: "🗾",
  brainEmoji: "🧠",
};
export const MyEmojiIcon = React.memo((props) => {
  const emojiIcon = myEmojiMap[props.icon];
  if (emojiIcon) {
    return <span>{emojiIcon}</span>;
  }
  return <ChonkyIconFA {...props} />;
});
// make stateful files

// write promise to get token
function getToken() {
  return new Promise((resolve, reject) => {
    // get code from url
    const xhr = new XMLHttpRequest();
    // get code from url
    const urlParams = new URLSearchParams(window.location.search);
    console.log("code", urlParams.get("code"));
    const code = urlParams.get("code");
    // console.log('requesting token')
    // console.log(`https://localhost:3000/auth?code=${code}`)
    xhr.open("GET", "https://localhost:3000/auth?code=" + code, true);
    xhr.send();
    // xhr promise
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        console.log("status 200");
        // console.log(xhr)
        token = xhr.responseText;
        // console.log('token', token);
        resolve(token);
      } else {
        // log error
        console.log("error");
        // reject('error');
      }
    };
  });
}

function UploadFiles() {
  // console.log('')
  const fileInput = document.getElementById("fileUpload");
  fileInput.click();
  fileInput.addEventListener("change", (e) => {
    // console.log('fileInput', fileInput.files);
    const files = fileInput.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("file", files[i]);
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://localhost:3000/upload", true);
    xhr.send(formData);
  });
}

function filterForImageAndSubdir(files) {
  var newFiles = [];
  var newFile = [];
  for (let i = 0; i < files.length; i++) {
    // console.log(files[i])
    // check if subdir key is in file
    if (Object.keys(files[i]).includes("subdir")) {
      newFile = {
        id: files[i].subdir,
        name: files[i].subdir,
        isDir: true,
        modDate: files[i].last_modified,
        size: files[i].bytes,
      };
    } else {
      // check if file is an image including tif, tiff, jpg, jpeg, png, check if it is in the list
      var accepted_types = ["tif", "tiff", "jpg", "jpeg", "png"];
      var file_type = files[i].name.split(".").pop();
      if (accepted_types.includes(file_type)) {
        newFile = {
          id: files[i].hash,
          name: files[i].name,
          isDir: false,
          modDate: files[i].last_modified,
          size: files[i].bytes,
        };
      }
    }
    newFiles.push(newFile);
  }
  return newFiles;
}

function ListBucketFiles(setFiles, bucket_name, folder_name) {
  // console.log('token', token);
  const xhr = new XMLHttpRequest();
  // var bucket_name = "space-for-testing-the-nutil-web-applicat";
  xhr.open(
    "GET",
    `https://localhost:3000/listBucket?bucketName=${bucket_name}&folderName=${folder_name}`,
    true
  );

  // add query strings
  // set a uthorization header
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.send();
  // console.log('test')
  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      console.log("status 200");
      var files = xhr.responseText;

      console.log("here");
      console.log(files);
      files = JSON.parse(files).objects;
      console.log("after parse");
      console.log(files);
      // iterate through files
      var newFiles = filterForImageAndSubdir(files);
      setFiles(newFiles);
      // console.log('fciles', files);
      // return files;
    } else {
      console.log("error", xhr);
      console.log("error");
    }
  };
}
const myFileActions = [
  ChonkyActions.CreateFolder,
  ChonkyActions.UploadFiles,
  ChonkyActions.DownloadFiles,
  ChonkyActions.DeleteFiles,
  ChonkyActions.EnableListView,
  ChonkyActions.SelectAllFiles,
  ChonkyActions.ClearSelection,
  SortFilesBySize,
];
myFileActions[1].button.group = "";
myFileActions[2].button.group = "";
myFileActions[3].button.group = "";
myFileActions[4].button.toolbar = false;
myFileActions[4].button.requiresSelection = true;
myFileActions[5].button.group = "";
myFileActions[5].hotkeys = ["ctrl+a"];

myFileActions[6].hotkeys = ["esc"];
myFileActions[6].button.group = "";
myFileActions[7].button.icon = "brainEmoji";
var returnStatus = "";
function pollJobStatus(
  jobID,
  SetMessage,
  SetProgressValue,
  SetCurrentImage,
  SetTotalImage,
  SetProgressImage
) {
  var xhr = new XMLHttpRequest();
  console.log("jobID", jobID);
  xhr.open("GET", `https://localhost:3000/jobStatus?jobID=` + jobID, true);
  // add query string
  console.log("returnStatus", returnStatus);
  if (returnStatus == "Done") {
    returnStatus = "";
    clearInterval(poller);
    return;
  }

  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      var jobStatus = xhr.responseText;
      jobStatus = JSON.parse(jobStatus);
      console.log(jobStatus);
      returnStatus = jobStatus["status"];
      SetProgressValue(jobStatus["progress"]);
      SetCurrentImage(jobStatus["current_image"]);
      SetTotalImage(jobStatus["total_images"]);
      var progressImages =
        (jobStatus["current_image"] / jobStatus["total_images"]) * 100;
      SetProgressImage(progressImages);
      SetMessage(jobStatus["status"]);
    }
  };
}
var poller = "";
function pollUntilDone(
  jobID,
  SetMessage,
  SetProgressValue,
  SetCurrentImage,
  SetTotalImage,
  SetProgressImage
) {
  poller = setInterval(
    pollJobStatus,
    1000,
    jobID,
    SetMessage,
    SetProgressValue,
    SetCurrentImage,
    SetTotalImage,
    SetProgressImage
  );
}

var jobID = "";
function App() {
  const [Message, SetMessage] = useState("");
  const [ProgressValue, SetProgressValue] = useState(0);
  const [ProgressImage, SetProgressImage] = useState(0);
  const [TotalImage, SetTotalImage] = useState(0);
  const [CurrentImage, SetCurrentImage] = useState(0);

  function MessageBox(props) {
    return (
      <div style={{ display: "flex" }}>
        <Progress
          type="circle"
          percent={ProgressImage}
          style={{ padding: "0.5rem" }}
          format={() => `${CurrentImage}/${TotalImage}`}
        ></Progress>

        <Progress
          type="circle"
          percent={ProgressValue}
          style={{ padding: "0.5rem" }}
        ></Progress>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0.5rem",
          }}
        >
          <h2>Select Images and create your brain</h2>
          <p>{props.message}</p>
        </div>
      </div>
    );
  }
  const [files, setFiles] = useState([null]);

  useEffect(() => {
    getToken()
      .then((token) => {
        if (token != null) {
          console.log("first run");
          token = token;
        }
      })
      .then(() => {
        console.log("token", token);
        ListBucketFiles(
          setFiles,
          "space-for-testing-the-nutil-web-applicat",
          ""
        );
      })
      .catch((err) => {
        console.log("failed");
      });
  }, []);

  function FileActionHandler(data) {
    // open a file picker UI
    // console.log('data', data);
    if (data.id == "open_files" && data.payload.targetFile.isDir) {
      console.log("open files");
      var targetFile = data.payload.targetFile;
      ListBucketFiles(
        setFiles,
        "space-for-testing-the-nutil-web-applicat",
        targetFile.name
      );
    }
    if (data.id == "upload_files") {
      // var xhr = new XMLHttpRequest();
      // xhr.open('GET', `https://localhost:3000/jobStatus?jobID=${jobID}` , true);
      // xhr.send();
      // xhr.onreadystatechange = function () {
      //   if (xhr.status == 200 && xhr.readyState == 4) {
      //     console.log('status 200')
      //     var jobStatus = xhr.responseText;
      //     jobStatus = JSON.parse(jobStatus);
      //     console.log('jobStatus', jobStatus);
      //     SetMessage(jobStatus['status'])
      //   }
      // }
      // SetMessage('Uploading Files');
      // console.log('token', token);
      // ListBucketFiles(setFiles);
      // ListBucketFiles();
    }
    if (data.id == "GenerateBrain") {
      var selectedFiles = null;
      // join all selected files with comma
      for (var i = 0; i < data.state.selectedFilesForAction.length; i++) {
        if (selectedFiles == null) {
          selectedFiles = data.state.selectedFilesForAction[i].name;
        } else {
          selectedFiles =
            selectedFiles + "," + data.state.selectedFilesForAction[i].name;
        }
      }
      console.log(data);
      console.log("selectedFiles", selectedFiles);
      var bucket_name = "space-for-testing-the-nutil-web-applicat";

      // request to generate brain
      var xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `https://localhost:3000/tiffListToTarDZI?bucketname=${bucket_name}&filelist=${selectedFiles}`,
        true
      );
      // set token to header
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send();
      xhr.onreadystatechange = function () {
        if (xhr.status == 200 && xhr.readyState == 4) {
          console.log("status", xhr.status);
          jobID = xhr.responseText;
          console.log("jobID numero", jobID);
          pollUntilDone(
            jobID,
            SetMessage,
            SetProgressValue,
            SetCurrentImage,
            SetTotalImage,
            SetProgressImage
          );
        }

        // server will respond first to confirm that the file has been uploaded with a 1xx status code
      };
      // poll job status every 5 seconds
      // kill the interval when pollJobStatus returns a 200 status code

      // pollJobStatus(jobID);
    }
  }

  const folderChain = [{ id: "xcv", name: "Demo", isDir: true }];
  return (
    <div style={{ height: "70vh" }}>
      <input
        type="file"
        style={{ display: "none" }}
        id="fileUpload"
        multiple="true"
      />
      <FileBrowser
        disableDefaultFileActions={true}
        onFileAction={FileActionHandler}
        files={files}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        fileActions={myFileActions}
        iconComponent={MyEmojiIcon}
      >
        <FileToolbar />
        <FileList />
        {/* <FileContextMenu /> */}
      </FileBrowser>
      <MessageBox message={Message} />
    </div>
  );
}

export default App;
{
  /* <FullFileBrowser files={files} defaultFileViewActionId={ChonkyActions.EnableListView.id} fileActions={myFileActions} folderChain={folderChain} */
}
