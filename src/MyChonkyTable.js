import {
  setChonkyDefaults, ChonkyActions, defineFileAction, FileBrowser,
  FileList,
  FileNavbar,
  FileToolbar
} from "chonky";
import { ChonkyIconFA } from "chonky-icon-fontawesome";
import React, { useEffect, useState } from "react";
import { ListBucketFiles, UploadFiles, DownloadFiles, DeleteFiles } from "./ButtonActions";
import "./MyChonkyTable.css";
import { useEventSource } from "react-use-websocket";
// import a dropdown menu from antd


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



const CreateBrainFromFiles = defineFileAction({
  id: "GenerateBrain",
  requiresSelection: false,

  button: {
    name: " ",
    toolbar: true,
  },
});


const UploadFolder = defineFileAction({
  id: "UploadFolder",
  requiresSelection: false,
  button: {
    name: "UploadFolder",
    toolbar: true,
  },
});

const checkForselectedFiles = defineFileAction({
  id: "checkForselectedFiles",
  requiresSelection: false,
  button: {
    name: "  ",
    toolbar: true
    }
  }
);




const myFileActions = [
  checkForselectedFiles,
  CreateBrainFromFiles,
  ChonkyActions.CreateFolder,
  ChonkyActions.UploadFiles,
  UploadFolder,
  ChonkyActions.DownloadFiles,
  ChonkyActions.DeleteFiles,
  ChonkyActions.EnableListView,
  ChonkyActions.SelectAllFiles,
  ChonkyActions.ClearSelection,
];


const uploadFileAction = myFileActions.find(action => action.id === ChonkyActions.UploadFiles.id);
uploadFileAction.button.group = "";
const uploadFolderAction = myFileActions.find(action => action.id === UploadFolder.id);
uploadFolderAction.button.group = "";
uploadFolderAction.button.icon = uploadFileAction.button.icon;

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
const CreateBrainFromFilesAction = myFileActions.find(action => action.id === CreateBrainFromFiles.id);
const checkForselectedFilesAction = myFileActions.find(action => action.id === checkForselectedFiles.id);


// CreateBrainFromFilesAction.button.icon = "brainEmoji";


function updateCurDirPath(curDirPath, SetCurDirPath) {
  if (!curDirPath.endsWith("/")) {
    curDirPath = curDirPath + "/";
  }
  if (curDirPath == "/") {
    curDirPath = "";
  }
  SetCurDirPath(curDirPath);
}


function createFileChain(targetFilePath) {
  var FileChain = [{ id: '/', name: 'Home', isDir: true, openable: true },];
  targetFilePath = targetFilePath.replace(/\/$/, "");
  for (var i = 0; i < targetFilePath.length; i++) {
    var temp = {
      // id should be a join of the array up to the current index
      id: targetFilePath.split("/").slice(0, i + 1).join("/"),
      name: targetFilePath.split("/")[i],
      isDir: true,
      openable: true,
    }
    FileChain[i + 1] = temp;
  }
  return FileChain;

}



function FileActionHandler(data, SetFolderChain, curDirPath, SetCurDirPath, setFiles, bucket_name, selectedAtlas,setCreateBrainActive, token) {
  // open a file picker UI
  console.log('data', data)
  if (data.id == "mouse_click_file" || data.id == "clear_selection"){
    console.log('mouse_click_file')
    const button = document.querySelector('[title="  "]');
    button.click();
    
  }
  if (data.id == "checkForselectedFiles") {
    console.log('checkForselectedFiles')
    console.log(data.state.selectedFiles)
    if (data.state.selectedFiles.length > 0) {
      setCreateBrainActive(true);
    }
    else {
      setCreateBrainActive(false);
    }
  }
  
  if (data.id == "open_files" && data.payload.targetFile.isDir) {
    var targetFile = data.payload.targetFile;
    var targetFileChain = createFileChain(targetFile.id);

    SetFolderChain(targetFileChain);

    curDirPath = targetFile.id;
    if (curDirPath == "/") {
      curDirPath = "";
    }
    // if curDirPath does not end with "/", add it
    if (!curDirPath.endsWith("/")) {
      curDirPath = curDirPath + "/";
    }
    updateCurDirPath(curDirPath, SetCurDirPath);


    console.log('listing bucket files', curDirPath)
    ListBucketFiles(
      setFiles,
      bucket_name,
      curDirPath,
      token
    );
  }

  if (data.id == "upload_files") {
    // open

    UploadFiles(curDirPath, setFiles, bucket_name, false, token);

  }
  if (data.id == "UploadFolder") {
    // open
    UploadFiles(curDirPath, setFiles, bucket_name, true, token);

  }
  // if (data.id == "create_folder") {
  //   AddToItems(setItems, items, 'test_new', 'Processing') 
  // }
  if (data.id == "download_files") {
    DownloadFiles(data, bucket_name, token);
  }
  if (data.id == "delete_files") {
    DeleteFiles(data, curDirPath, setFiles, bucket_name, token);
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
    // set bucket name
    // acquire brain ID from Input with ID brainID
    var brainID = document.getElementById("brainIDInput").value;
    // get the value of a select
    console.log('brainID', brainID)
    console.log('targetatlas', selectedAtlas)

    // request to generate brain
    var xhr = new XMLHttpRequest();
    let redirect_uri = process.env.REACT_APP_URL;

    console.log("CurDIRPath: " + curDirPath);
    if (process.env.NODE_ENV === 'development') {
      xhr.open("GET", `${redirect_uri}/tiffListToTarDZI?bucketname=${bucket_name}&filelist=${selectedFiles}&brainID=${brainID}&folderName=${curDirPath}&selectedAtlas=${selectedAtlas}`, true);
    } else {
      xhr.open("GET", `/tiffListToTarDZI?bucketname=${bucket_name}&filelist=${selectedFiles}&brainID=${brainID}&folderName=${curDirPath}&selectedAtlas=${selectedAtlas}`, true);
    }
    // set token to header
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send();


  }
}


function MyChonkyTable(args) {
  var folderChain = args.folderChain;
  var SetFolderChain = args.SetFolderChain;
  var curDirPath = args.curDirPath;
  var SetCurDirPath = args.SetCurDirPath;
  var files = args.files;
  var setFiles = args.setFiles;
  var token = args.token;
  var bucket_name = args.currentBucket;
  var selectedAtlas = args.selectedAtlas;
  var setCreateBrainActive = args.setCreateBrainActive;
  console.log('args', args)

  function passToFileAction(SetFolderChain, curDirPath, SetCurDirPath, setFiles, bucket_name, selectedAtlas, token) {
    return function (data) {
      FileActionHandler(data, SetFolderChain, curDirPath, SetCurDirPath, setFiles, bucket_name, selectedAtlas, setCreateBrainActive,token);
    }
  }

  var button = document.querySelector('[title=" "]');

  // make button invisible
  if (button != null) {
    button.style.display = "none";
  }




  return (
    <div id="uploadContainer">
      <input
        type="file"
        id="hiddenFileUploadButton"
        // style={{ display: "none" }}
        multiple="true"


      />
      {/* create directory upload button */}
      <input
        id="hiddenFolderUploadButton"
        type="file"
        webkitdirectory="true"
        directory="true"
        multiple="true"
      />


      <FileBrowser
        disableDefaultFileActions={true}
        onFileAction={passToFileAction(SetFolderChain, curDirPath, SetCurDirPath, setFiles, bucket_name, selectedAtlas, token)}
        files={files}


        defaultFileViewActionId={ChonkyActions.EnableListView.id}
        fileActions={myFileActions}
        folderChain={folderChain}
        iconComponent={MyEmojiIcon}
        clearSelectionOnOutsideClick={false}
      >
        <FileNavbar />

        <FileToolbar />

        <FileList />
        {/* <FileContextMenu /> */}
      </FileBrowser >
    </div>
  );
}



export default MyChonkyTable;