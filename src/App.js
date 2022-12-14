import { setChonkyDefaults } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import { FullFileBrowser, ChonkyActions } from 'chonky';
import logo from './logo.svg';

import './App.css';
import React, { useEffect, useState } from 'react';
// import Button from '@material-ui/core/Button';
import {
  FileBrowser,
  FileContextMenu,
  FileList,
  FileNavbar,
  FileToolbar,
} from 'chonky';

import { defineFileAction, FileData } from 'chonky';
import { Nullable } from 'tsdef';

var token = null

const SortFilesBySize = defineFileAction({
  id: 'GenerateBrain',
  requiresSelection: true,

  button: {
    name: 'Generate Brain from Files',
    toolbar: true,
  },
});
// Somewhere in your `index.ts`:
setChonkyDefaults({ iconComponent: ChonkyIconFA });

const myEmojiMap = {
  bentoEmoji: '🍱',
  angryEmoji: '😠',
  japanEmoji: '🗾',
  brainEmoji: '🧠',
};
export const MyEmojiIcon = React.memo((props) => {
  const emojiIcon = myEmojiMap[props.icon];
  if (emojiIcon) {
    return <span>{emojiIcon}</span>;
  }
  return <ChonkyIconFA {...props} />;
});
// make stateful files


function FileActionHandler(data) {
  // open a file picker UI
  // console.log('data', data);
  if (data.id == 'upload_files') {
    // console.log('token', token);
    // ListBucketFiles(setFiles);
    // ListBucketFiles();
  }
  if (data.id == 'GenerateBrain') {
    var selectedFiles = data.state.selectedFilesForAction[0].name;
    console.log(data)
    console.log('selectedFiles', selectedFiles);
    var bucket_name = 'space-for-testing-the-nutil-web-applicat'

    // request to generate brain
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://localhost:3000/tiffToTarDZI?bucketname=${bucket_name}&filename=${selectedFiles}`, true);
    // set token to header
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send();

  }
}
// function getToken() {
//   // get code from url
//   const xhr = new XMLHttpRequest();
//   // get code from url
//   const urlParams = new URLSearchParams(window.location.search);
//   const code = urlParams.get('code');
//   console.log(`https://localhost:3000/auth?code=${code}`)
//   xhr.open('GET', 'https://localhost:3000/auth?code=' + code, true);
//   xhr.send();
//   xhr.onreadystatechange = function () {
//     if (xhr.readyState == 4 && xhr.status == 200) {
//       token = xhr.responseText
//       console.log('token', token);
//       return token;
//     }
//     else {
//       return null;
//     }
//   }
//   // }

// write promise to get token
function getToken() {
  return new Promise((resolve, reject) => {
    // get code from url
    const xhr = new XMLHttpRequest();
    // get code from url
    const urlParams = new URLSearchParams(window.location.search);
    console.log('code', urlParams.get('code'));
    const code = urlParams.get('code');
    // console.log('requesting token')
    // console.log(`https://localhost:3000/auth?code=${code}`)
    xhr.open('GET', 'https://localhost:3000/auth?code=' + code, true);
    xhr.send();
    // xhr promise 
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        console.log('status 200')
        // console.log(xhr)
        token = xhr.responseText
        // console.log('token', token);
        resolve(token);
      }
      else {
        // log error
        console.log('error');
        // reject('error');
      }
    }
  });
}


function UploadFiles() {
  // console.log('')
  const fileInput = document.getElementById('fileUpload');
  fileInput.click();
  fileInput.addEventListener('change', (e) => {
    // console.log('fileInput', fileInput.files);
    const files = fileInput.files;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://localhost:3000/upload', true);
    xhr.send(formData);
  });

}
function ListBucketFiles(setFiles) {
  // console.log('token', token);
  const xhr = new XMLHttpRequest();
  var bucket_name = 'space-for-testing-the-nutil-web-applicat'
  xhr.open('GET', 'https://localhost:3000/listBucket?bucketName=' + bucket_name, true);
  // add query string
  // set a uthorization header
  xhr.setRequestHeader('Authorization', 'Bearer ' + token)
  xhr.send();
  // console.log('test')
  var newFiles = [];
  var newFile = [];
  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      console.log('status 200')
      var files = xhr.responseText;
      // console.log('here')
      // console.log(files)
      files = JSON.parse(files).objects;
      console.log('after parse')
      console.log(files)
      // iterate through files

      for (let i = 0; i < files.length; i++) {
        // console.log(files[i])
        // check if subdir key is in file
        if (Object.keys(files[i]).includes('subdir')) {
          newFile = { id: files[i].subdir, name: files[i].subdir, isDir: true, modDate: files[i].last_modified, size: files[i].bytes };
        }
        else {
          // convert modeDate to date

          newFile = { id: files[i].hash, name: files[i].name, isDir: false, modDate: files[i].last_modified, size: files[i].bytes };

        }
        newFiles.push(newFile);
        // setFiles(files[i]);
      }
      setFiles(newFiles);
      // console.log('fciles', files);
      // return files;
    }
    else {
      // console.log('error', xhr);
      // console.log('error')
    }
  }
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
myFileActions[1].button.group = '';
myFileActions[2].button.group = '';
myFileActions[3].button.group = '';
myFileActions[4].button.toolbar = false;
myFileActions[4].button.requiresSelection = true;
myFileActions[5].button.group = '';
myFileActions[5].hotkeys = ['ctrl+a'];

myFileActions[6].hotkeys = ['esc'];
myFileActions[6].button.group = '';
myFileActions[7].button.icon = 'brainEmoji';


function App() {
  const [files, setFiles] = useState([
    { id: 'lht', name: 'Projects', isDir: true },
    {
      id: 'mcd',
      name: 'chonky-sphere-v2.png',
      thumbnailUrl: 'https://chonky.io/chonky-sphere-v2.png',
    },
  ]);
  useEffect(() => {
    getToken().then((token) => {
      if (token != null) {
        console.log('first run')
        token = token;
      }


    }).then(() => {
      console.log('token', token);
      ListBucketFiles(setFiles);
    }
    ).catch((err) => {
      console.log('failed');
    })
  }, [])




  const folderChain = [{ id: 'xcv', name: 'Demo', isDir: true }]
  return (

    <div style={{ height: '100vh' }}>
      <input
        type="file"
        style={{ display: 'none' }}
        id="fileUpload"
        multiple="true"
      />
      <FileBrowser disableDefaultFileActions={true} onFileAction={FileActionHandler} files={files} defaultFileViewActionId={ChonkyActions.EnableListView.id} fileActions={myFileActions} iconComponent={MyEmojiIcon}>

        <FileToolbar />
        <FileList />
        <FileContextMenu />
      </FileBrowser>

    </div >
  )
}

export default App;
{/* <FullFileBrowser files={files} defaultFileViewActionId={ChonkyActions.EnableListView.id} fileActions={myFileActions} folderChain={folderChain} */ }

