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
// set cors to allow all
// require
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

function getToken() {
  console.log('getting token')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    console.log('xhr')
    const urlParams = new URLSearchParams(window.location.search);
    console.log('here')
    const code = urlParams.get("code");
    console.log('code', code)
    // clear url
    window.history.pushState({}, document.title, "/" );
    if (process.env.NODE_ENV === "development") {
      var redirect_uri = process.env.REACT_APP_DEV_URL;
    } else {
      var redirect_uri = process.env.REACT_APP_PROD_URL;
    }
    xhr.open("GET", `${redirect_uri}/auth?code=${code}`, true);
    console.log(`${redirect_uri}/auth?code=${code}`)
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        token = xhr.responseText;
        console.log('token', token)
        resolve(token);
      }
    };
  });
}

function DownloadFiles(fileActionDispatch) {
  console.log(fileActionDispatch)
  var selectedFiles = fileActionDispatch.state.selectedFilesForAction;
  console.log(selectedFiles)
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const xhr = new XMLHttpRequest();
    // get request to download file
    xhr.open("GET", `https://data-proxy.ebrains.eu/api/v1/buckets/space-for-testing-the-nutil-web-applicat/${file.id}?redirect=false`, true);
    console.log(`https://data-proxy.ebrains.eu/api/v1/buckets/space-for-testing-the-nutil-web-applicat/${file.id}`)
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("x-amz-date", new Date().toUTCString());
    // log request
    console.log(xhr);
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        // return file as blob
        // create a link to download the file
        var link = document.createElement("a");
        // parse response
        var url = JSON.parse(xhr.responseText)
      
        link.href = url.url;
        link.download = file.name;
        link.click();
      }
    };
  }
}

function DeleteFiles(fileActionDispatch,curDirPath, setFiles) {
  var selectedFiles = fileActionDispatch.state.selectedFilesForAction;
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const xhr = new XMLHttpRequest();
    // delete request to delete file
    xhr.open("DELETE", `https://data-proxy.ebrains.eu/api/v1/buckets/space-for-testing-the-nutil-web-applicat/${file.id}`, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("x-amz-date", new Date().toUTCString());
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        // log success
        console.log('success')

        ListBucketFiles(
          setFiles,
          "space-for-testing-the-nutil-web-applicat",
          curDirPath
        );
      } else {
        // log error
        console.log(xhr.status)
        console.log('error')
        
      }
    }
  }
}

function UploadFiles(curDirPath, setFiles) {
  const fileInput = document.getElementById("fileUpload");
  fileInput.click();
  fileInput.addEventListener("change", (e) => {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      const xhr = new XMLHttpRequest();
      console.log(file)
      // put request to upload file
      xhr.open("PUT", `https://data-proxy.ebrains.eu/api/v1/buckets/space-for-testing-the-nutil-web-applicat/${file.name}`, true);
      // add query strings
      // set a uthorization header
      xhr.setRequestHeader("Authorization", "Bearer " + token);
      // send without body 
      xhr.send();
      xhr.onreadystatechange = function () {
        if (xhr.status == 200 && xhr.readyState == 4) {
          // log success
          // post image to bucket
          var target_url = xhr.responseText;
          console.log('target_url1')
          console.log(target_url)
          // convert to json
          target_url = JSON.parse(target_url)
          target_url = target_url.url
          console.log('target_url2', target_url)
          console.log(xhr.response)
          const xhr2 = new XMLHttpRequest();
          xhr2.open("PUT", target_url, true);
          // xhr2.setRequestHeader("Content-Type", "application/octet");
          // fix bug AWS authentication requires a valid Date or x-amz-date header
          // xhr2.setRequestHeader("Authorization", "Bearer " + token);
          // set date header to z-amz-date
          xhr2.setRequestHeader("x-amz-date", new Date().toUTCString());
          xhr2.send(file);
          xhr2.onreadystatechange = function () {
            if (xhr2.status == 201 && xhr2.readyState == 4) {
              // log success
              console.log('success')

              ListBucketFiles(
                setFiles,
                "space-for-testing-the-nutil-web-applicat",
                curDirPath
              );
            } else {
              // log error
              console.log(xhr2.status)
              console.log('error')
              
            }
          }

        } else {
          // log error
          console.log('error')
        }
      }
    }
  });

}

function filterForImageAndSubdir(files) {
  var newFiles = [];
  var accepted_types = ["tif", "tiff", "jpg", "jpeg", "png"];
  for (let i = 0; i < files.length; i++) {
    var newFile = getNewFile(files[i], accepted_types);
    if (newFile != null) {
      newFiles.push(newFile);
    }
  }
  return newFiles;
}

function getNewFile(file, accepted_types) {
  var newFile = {};

  // check if subdir key is in file
  if (Object.keys(file).includes("subdir")) {
    var name = file.subdir;
    var id = file.subdir;
    var isDir = true;
  } else if (Object.keys(file).includes("name")){
    var filetype = file.name.split(".").pop();
    if (accepted_types.includes(filetype)) {
      var name = file.name;
      var id = file.name;
      var isDir = false;
    }
    else {
      return null;
    }
  } else {
    return null;
  }

  // remove trailing slash from name with regex
  name = name.replace(/\/$/, "");
  // split name by slash
  name = name.split("/").pop();
  // if isdir add trailing slash
  if (isDir) {
    name = name + "/";
  }

  newFile = {
    id: id,        
    // get the second to last element in the array
    name: name,
    isDir: isDir,
    modDate: file.last_modified,
    size: file.bytes,
    
  };

  return newFile;
}

function ListBucketFiles(setFiles, bucket_name, folder_name) {
  
  const xhr = new XMLHttpRequest();
  // var bucket_name = "space-for-testing-the-nutil-web-applicat";
  if (process.env.NODE_ENV === "development") {
    var target_url = process.env.REACT_APP_DEV_URL;
  } else {
    var target_url = process.env.REACT_APP_PROD_URL;
  }
  xhr.open(
    "GET",
    `${target_url}/listBucket?bucketName=${bucket_name}&folderName=${folder_name}`,
    true
  );

  // add query strings
  // set a uthorization header
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      var files = xhr.responseText;


      files = JSON.parse(files).objects;

      // iterate through files
      var newFiles = filterForImageAndSubdir(files);
      setFiles(newFiles);
      // return files;
    } else {

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



const uploadFileAction = myFileActions.find(action => action.id === ChonkyActions.UploadFiles.id);
uploadFileAction.button.group = "";
const downloadFileAction = myFileActions.find(action => action.id === ChonkyActions.DownloadFiles.id);
downloadFileAction.button.group = "";
const deleteFileAction = myFileActions.find(action => action.id === ChonkyActions.DeleteFiles.id);
deleteFileAction.button.group = "";
const enableListViewAction = myFileActions.find(action => action.id === ChonkyActions.EnableListView.id);
enableListViewAction.button.toolbar = false;
enableListViewAction.button.requiresSelection = true;
const selectAllFilesAction = myFileActions.find(action => action.id === ChonkyActions.SelectAllFiles.id);
selectAllFilesAction.button.toolbar = false;
selectAllFilesAction.button.group = "";
selectAllFilesAction.hotkeys = ["ctrl+a"];
const clearSelectionAction = myFileActions.find(action => action.id === ChonkyActions.ClearSelection.id);
clearSelectionAction.button.toolbar = false;
clearSelectionAction.hotkeys = ["esc"];
clearSelectionAction.button.group = "";
const sortFilesBySizeAction = myFileActions.find(action => action.id === SortFilesBySize.id);
sortFilesBySizeAction.button.icon = "brainEmoji";
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
  xhr.open("GET", `https://localhost:3000/jobStatus?jobID=` + jobID, true);
  // add query string
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
  const [folderChain, SetFolderChain] = useState([{ id: '/', name: 'Home', isDir: true, openable:true},]);
  var [curDirPath, SetCurDirPath] = useState("");


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
          console.log(token)
          token = token;
        };
      // set url to localhost:3000

      })
      .then(() => {
        ListBucketFiles(
          setFiles,
          "space-for-testing-the-nutil-web-applicat",
          curDirPath
        );
      })
      .catch((err) => {
      });
  }, []);








  function createFileChain(targetFilePath) {
    var FileChain = [{ id: '/', name: 'Home', isDir: true, openable:true},];
    targetFilePath = targetFilePath.replace(/\/$/, "");
    for (var i = 0; i < targetFilePath.length  ; i++) {
      var temp = {
        // id should be a join of the array up to the current index
        id : targetFilePath.split("/").slice(0, i + 1).join("/"),
        name : targetFilePath.split("/")[i],
        isDir : true,
        openable : true,
    }
    FileChain[i+1] = temp;
    }
    return FileChain;
    
  }

  function updateCurDirPath(curDirPath) {
    if (!curDirPath.endsWith("/")) {
      curDirPath = curDirPath + "/";
    }
    if (curDirPath == "/")
    {
      curDirPath = "";
    }
    SetCurDirPath(curDirPath);
  }





  function FileActionHandler(data) {
    // open a file picker UI
    if (data.id == "open_files" && data.payload.targetFile.isDir) {
      var targetFile = data.payload.targetFile;
      var targetFileChain = createFileChain(targetFile.id);

      SetFolderChain(targetFileChain);

      curDirPath= targetFile.id;
      if (curDirPath == "/")
      {
        curDirPath = "";
      }
      updateCurDirPath(curDirPath);
      console.log('curDirPath', curDirPath)


      ListBucketFiles(
        setFiles,
        "space-for-testing-the-nutil-web-applicat",
        curDirPath
      );
    }
  
    if (data.id == "upload_files") {
      // open

      UploadFiles(curDirPath, setFiles);
    
    }
    if (data.id == "download_files") {
      DownloadFiles(data);
    }
    if (data.id == "delete_files") {
      DeleteFiles(data, curDirPath, setFiles);
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

      var bucket_name = "space-for-testing-the-nutil-web-applicat";

      // request to generate brain
      var xhr = new XMLHttpRequest();
      if (process.env.NODE_ENV === "development") {
        var target_url = process.env.REACT_APP_DEV_URL;
      } else {
        var target_url = process.env.REACT_APP_PROD_URL;
      }
      xhr.open(
        "GET",
        `${target_url}/tiffListToTarDZI?bucketname=${bucket_name}&filelist=${selectedFiles}`,
        true
      );
      // set token to header
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send();
      xhr.onreadystatechange = function () {
        if (xhr.status == 200 && xhr.readyState == 4) {
          jobID = xhr.responseText;
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

  return (
    <div style={{ height: "70vh" }}>
      <input
        type="file"
        style={{ display: "none" }}
        id="fileUpload"
        multiple="true"
 
        // accept directory

      />
      <FileBrowser
        disableDefaultFileActions={true}
        onFileAction={FileActionHandler}
        files={files}
        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        fileActions={myFileActions}
        folderChain={folderChain}
        iconComponent={MyEmojiIcon}
      >
        <FileNavbar />

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
