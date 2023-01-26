import { setChonkyDefaults , ChonkyActions, defineFileAction,   FileBrowser,
    FileList,
    FileNavbar,
    FileToolbar} from "chonky";
import { ChonkyIconFA } from "chonky-icon-fontawesome";
import React, { useEffect, useState } from "react";
import { ListBucketFiles, UploadFiles, DownloadFiles, DeleteFiles } from "./ButtonActions";


setChonkyDefaults({ iconComponent: ChonkyIconFA });


const myEmojiMap = {
  bentoEmoji: "🍱",
  angryEmoji: "😠",
  japanEmoji: "🗾",
  brainEmoji: "🧠",
};

var token = null 

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
      name: "Generate Brain from Files",
      toolbar: true,
    },
  });
  



  const myFileActions = [
    ChonkyActions.CreateFolder,
    ChonkyActions.UploadFiles,
    ChonkyActions.DownloadFiles,
    ChonkyActions.DeleteFiles,
    ChonkyActions.EnableListView,
    ChonkyActions.SelectAllFiles,
    ChonkyActions.ClearSelection,
    CreateBrainFromFiles,
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
const CreateBrainFromFilesAction = myFileActions.find(action => action.id === CreateBrainFromFiles.id);
CreateBrainFromFilesAction.button.icon = "brainEmoji";


function updateCurDirPath(curDirPath, SetCurDirPath) {
    if (!curDirPath.endsWith("/")) {
      curDirPath = curDirPath + "/";
    }
    if (curDirPath == "/")
    {
      curDirPath = "";
    }
    SetCurDirPath(curDirPath);
  }


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



  function FileActionHandler(data, SetFolderChain,curDirPath, SetCurDirPath, setFiles, token) {
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
      updateCurDirPath(curDirPath, SetCurDirPath);
      


      ListBucketFiles(
        setFiles,
        "space-for-testing-the-nutil-web-applicat",
        curDirPath,
        token
      );
    }
  
    if (data.id == "upload_files") {
      // open

      UploadFiles(curDirPath, setFiles, token);
    
    }
    if (data.id == "create_folder") {
      AddToItems(setItems, items, 'test_new', 'Processing') 
    }
    if (data.id == "download_files") {
      DownloadFiles(data, token);
    }
    if (data.id == "delete_files") {
      DeleteFiles(data, curDirPath, setFiles, token);
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
      var bucket_name = "space-for-testing-the-nutil-web-applicat";
      // acquire brain ID from Input with ID brainID
      var brainID = document.getElementById("brainIDInput").value;

      // request to generate brain
      var xhr = new XMLHttpRequest();
      if (process.env.NODE_ENV === "development") {
        var target_url = process.env.REACT_APP_DEV_URL;
      } else {
        var target_url = process.env.REACT_APP_PROD_URL;
      }
      console.log('trying with token: ' + token)
      xhr.open(
        "GET",
        `${target_url}/tiffListToTarDZI?bucketname=${bucket_name}&filelist=${selectedFiles}&brainID=${brainID}`,
        true
      );
      // set token to header
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send();


    }
  }
  function getToken() {
  
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      const urlParams = new URLSearchParams(window.location.search);
      
      const code = urlParams.get("code");
      
      // clear url
      window.history.pushState({}, document.title, "/" );
      if (process.env.NODE_ENV === "development") {
        var redirect_uri = process.env.REACT_APP_DEV_URL;
        xhr.open("GET", `${redirect_uri}/auth?code=${code}`, true);
      } else {
        var redirect_uri = process.env.REACT_APP_PROD_URL;
        xhr.open("GET", `auth?code=${code}`, true);
  
      }
      
      
      xhr.send();
      xhr.onreadystatechange = function () {
        if (xhr.status == 200 && xhr.readyState == 4) {
          token = xhr.responseText;
          
          resolve(token);
        }
  
      };
    });
  }

  function MyChonkyTable(args) {
    var folderChain = args.folderChain;
    var SetFolderChain = args.SetFolderChain;
    var curDirPath = args.curDirPath;
    var SetCurDirPath = args.SetCurDirPath;
    var files = args.files;
    var setFiles = args.setFiles;
    
    function passToFileAction (SetFolderChain, curDirPath, SetCurDirPath,setFiles, token) {
        return function (data) {
            FileActionHandler(data, SetFolderChain, curDirPath, SetCurDirPath,setFiles,token);
        }
    }
    useEffect(() => {
        getToken().then((token) => {
        var token = token;
        console.log('token2: ' + token)
        ListBucketFiles(
          setFiles,
          "space-for-testing-the-nutil-web-applicat",
          curDirPath,
          token
        );
      })
    }, [])  
    
    console.log('token: ', token)
    return (
        <div style = {{'height': '70vh'}}>
        <input
        type="file"
        style={{ display: "none" }}
        id="fileUpload"
        multiple="true"
 
        // accept directory

      />
      <FileBrowser
        disableDefaultFileActions={true}
        onFileAction={passToFileAction(SetFolderChain,curDirPath, SetCurDirPath,setFiles, token)}
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
        </div>
    );
    }



export default MyChonkyTable;