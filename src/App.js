
import "./App.css";
import React, { useEffect, useState } from "react";
import MyChonkyTable from "./MyChonkyTable";
import JobProcessor from "./JobProcessor";
import {getToken} from "./getToken";
import { ListBucketFiles } from "./ButtonActions";
import SearchAbleDropdown from "./SearchAbleDropdown";
import { Button, Progress,Spin } from 'antd';


// create onmessage function for the websocket

// 
const messages = [
  "Do not change the page while uploading",
];

function App() {

  const [message, setMessage] = useState(messages[0]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const randomIndex = Math.floor(Math.random() * messages.length);
  //     setMessage(messages[randomIndex]);
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  // get state from the url
  var urlParams = new URLSearchParams(window.location.search);
  console.log("urlParams")
  console.log(urlParams)
  // check if url includes ebrainsworkbench
  // var url = window.location.href;

  // if (url.includes("ebrainsworkbench")){
    // get the state from the url
  var init_bucket_state = urlParams.get("state");
  // decode url
  if (init_bucket_state !== null){
    var bucket_state = decodeURIComponent(init_bucket_state)
    // json encode
    bucket_state = JSON.parse(bucket_state)
    bucket_state = bucket_state["clb-collab-id"]
    // bucket_state
    console.log(bucket_state)
  }
  const [currentBucket, SetCurrentBucket] = useState(bucket_state);


  
  const [folderChain, SetFolderChain] = useState([{ id: '/', name: 'Home', isDir: true, openable:true},]);
  var   [curDirPath, SetCurDirPath] = useState("");
  const [CurrentJob, SetCurrentJob] = useState(null);

  var [token, SetToken] = useState(null);
  const [files, setFiles] = useState([null]);
    //   bucket_name = urlParams.get("clb-collab-id")
  // setToken(8);
  // SetCurrentBucket("deepslice");
  useEffect(() => {
    
    console.log('getting token')
    getToken(token)

    .then((ret_val) => {
      token = ret_val;
      console.log("token: " + token)
      console.log('curDirPath', curDirPath)
      SetToken(ret_val);
      
      ListBucketFiles(
      setFiles,
      currentBucket,
      curDirPath,
      token
    )
    })
    .then(() => {
      window.history.pushState({}, document.title, "/?clb-collab-id=" + currentBucket );
    })
    .catch((err) => {
      
      
    })
    ;
  }, []);






  const [selectedAtlas, setSelectedAtlas] = useState('');
  const [progressActive, setProgressActive] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  

  const  [createBrainActive, setCreateBrainActive]  = useState(false);
  function onClick() {
    setProgressActive(false)
    setProgressPercent(0)
  }
  if (!token) {
    return     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size='large' style={{marginBottom:'6rem'}}>
      <h1  style={{marginTop:'6rem'}}>Logging In</h1>
      <div className="content" />
    </Spin>
 </div>;
  }
  return (
    <div>
    {progressActive && (
      <div className="progress">
        <div className="progress-box">
          <div className="progress-text">
            <h2>{progressPercent === 100 ? "Files Uploaded!" : <div>{message} <span className="ellipsis"></span></div>}</h2>
            </div>
          <Progress percent={progressPercent} />
            <Button disabled={progressPercent !== 100} onClick={onClick}>OK</Button>
          </div>
      </div>
    )}
    {uploadFailed && (
      <div className="progress">
        <div className="progress-box">
          <div className="progress-text">
            <h3>At least one of your filenames does not  include _sXXX (a number corresponding to its cutting index). Please fix this and try again</h3>
            </div>
          <Button onClick={() => setUploadFailed(false)}>OK</Button>
          </div>
      </div>
    )}
      <SearchAbleDropdown
      currentBucket={currentBucket}
      SetCurrentBucket={SetCurrentBucket}
      token={token}
      setFiles = {setFiles} 
      curDirPath={curDirPath} 
      ></SearchAbleDropdown>
      <MyChonkyTable token={token} currentBucket={currentBucket} files={files} setFiles = {setFiles} selectedAtlas={selectedAtlas} folderChain = {folderChain} SetFolderChain={SetFolderChain} curDirPath={curDirPath} SetCurDirPath={SetCurDirPath} setCreateBrainActive={setCreateBrainActive} setProgressPercent={setProgressPercent} setProgressActive={setProgressActive} setUploadFailed={setUploadFailed}></MyChonkyTable>
      <div id="bottom_of_page" style={{position:'absolute', bottom:0, width:'100vw', minHeight:'30vh'}}>
      <div id="margin" style={{'height':'1vh',  'backgroundColor':'gray', 'marginBottom':'0.5vh'}}></div>
      <JobProcessor
      token = {token}
      currentBucket={currentBucket}
      CurrentJob = {CurrentJob}
      SetCurrentJob = {SetCurrentJob}
      selectedAtlas = {selectedAtlas}
      setSelectedAtlas = {setSelectedAtlas} 
      createBrainActive = {createBrainActive}
      setUploadFailed={setUploadFailed}
      ></JobProcessor>
</div>
      </div>

  );
  }


export default App;

  // };
  