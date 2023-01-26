
import "./App.css";
import React, { useEffect, useState } from "react";
import MyChonkyTable from "./MyChonkyTable";
import JobProcessor from "./JobProcessor";
import {getToken} from "./getToken";
import { ListBucketFiles } from "./ButtonActions";
import SearchAbleDropdown from "./SearchAbleDropdown";

console.log('getToken', getToken)
function App() {

  const [folderChain, SetFolderChain] = useState([{ id: '/', name: 'Home', isDir: true, openable:true},]);
  var   [curDirPath, SetCurDirPath] = useState("");
  const [currentBucket, SetCurrentBucket] = useState("deepslice");
  var [token, SetToken] = useState(null);
  const [files, setFiles] = useState([null]);
    //   bucket_name = urlParams.get("clb-collab-id")
  // setToken(8);
  // SetCurrentBucket("deepslice");
  console.log("currentBucket", currentBucket)
  console.log('token', token)
  if (token == null) {
    getToken().then((token) => {
      token = token;
      SetToken(token);

      ListBucketFiles(
      setFiles,
      currentBucket,
      curDirPath,
      token
    );
    console.log(token)
  })
  
  }









  


  
  return (
    <div>
      <SearchAbleDropdown
      currentBucket={currentBucket}
      SetCurrentBucket={SetCurrentBucket}
      token={token}
      ></SearchAbleDropdown>
      <MyChonkyTable  token={token} currentBucket={currentBucket} files={files} setFiles = {setFiles} folderChain = {folderChain} SetFolderChain={SetFolderChain} curDirPath={curDirPath} SetCurDirPath={SetCurDirPath}></MyChonkyTable>
      <JobProcessor
      
      currentBucket={currentBucket}
      ></JobProcessor>

      </div>

  );
  }


export default App;
  // function getUser() {
  //   var user_nid = "";
  //   return new Promise((resolve, reject) => {
  //     // make request to getUser
  //     var xhr = new XMLHttpRequest();
  //     xhr.open("GET", "https://localhost:8080/getuser", true);
  //     xhr.setRequestHeader("Content-Type", "application/json");
  //     xhr.setRequestHeader("Authorization", token);
  //     xhr.send();
  //     xhr.onreadystatechange = function () {
  //       if (xhr.readyState == 4 && xhr.status == 200) {
  //         var user = xhr.responseText;
  //         user = JSON.parse(user).data;
  //         user_nid = user["https://schema.hbp.eu/users/nativeId"];
          
  //         resolve(user);
  //       }
  //   }
  // });
  // };
  