
import "./App.css";
import React, { useEffect, useState } from "react";
import MyChonkyTable from "./MyChonkyTable";
import JobProcessor from "./JobProcessor";
import {getToken} from "./getToken";
import { ListBucketFiles } from "./ButtonActions";
import SearchAbleDropdown from "./SearchAbleDropdown";


// create onmessage function for the websocket

// 
function App() {


  // get state from the url
  const urlParams = new URLSearchParams(window.location.search);
  console.log("urlParams")
  console.log(urlParams)
  var bucket_state = urlParams.get("state");
  // decode url
  bucket_state = decodeURIComponent(bucket_state)
  // json encode
  bucket_state = JSON.parse(bucket_state)
  bucket_state = bucket_state["clb-bucket-id"]
  // bucket_state
  console.log(bucket_state)
  const [currentBucket, SetCurrentBucket] = useState(bucket_state);

  const [folderChain, SetFolderChain] = useState([{ id: '/', name: 'Home', isDir: true, openable:true},]);
  var   [curDirPath, SetCurDirPath] = useState("");
  // const [currentBucket, SetCurrentBucket] = useState("space-for-testing-the-nutil-web-applicat");
  const [CurrentJob, SetCurrentJob] = useState(null);

  var [token, SetToken] = useState(null);
  const [files, setFiles] = useState([null]);
    //   bucket_name = urlParams.get("clb-collab-id")
  // setToken(8);
  // SetCurrentBucket("deepslice");
  useEffect(() => {
    
    
    getToken(token)
    .then((ret_val) => {
      token = ret_val;
      SetToken(ret_val);
      
      ListBucketFiles(
      setFiles,
      currentBucket,
      curDirPath,
      token
    )
    })
    .catch((err) => {
      
    })
    ;
  }, []);









  


  
  return (
    <div>
      <SearchAbleDropdown
      currentBucket={currentBucket}
      SetCurrentBucket={SetCurrentBucket}
      token={token}
      setFiles = {setFiles} 
      curDirPath={curDirPath} 
      ></SearchAbleDropdown>
      <MyChonkyTable token={token} currentBucket={currentBucket} files={files} setFiles = {setFiles} folderChain = {folderChain} SetFolderChain={SetFolderChain} curDirPath={curDirPath} SetCurDirPath={SetCurDirPath}></MyChonkyTable>
      <JobProcessor
      token = {token}
      currentBucket={currentBucket}
      CurrentJob = {CurrentJob}
      SetCurrentJob = {SetCurrentJob}
      ></JobProcessor>

      </div>

  );
  }


export default App;

  // };
  