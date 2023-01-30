
import "./App.css";
import React, { useEffect, useState } from "react";
import MyChonkyTable from "./MyChonkyTable";
import JobProcessor from "./JobProcessor";
import {getToken} from "./getToken";
import { ListBucketFiles } from "./ButtonActions";
import SearchAbleDropdown from "./SearchAbleDropdown";

// handle imports for the websocket
import useWebSocket, { ReadyState } from "react-use-websocket";


// handle requests for the websocket
const WS_URL = "ws://localhost:8083";


// create onmessage function for the websocket

// 
var count = 0
function App() {

  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(WS_URL, {
    onOpen: () => {
      console.log("opened count: " + count);
      count = count + 1;
      // add a listener to the websocket
      getWebSocket().addEventListener("message", (event) => {
        console.log(event.data);
      });


    }
  });
  // send a message to the websocket
  count = count + 1;
  // sendMessage("Hello" + count);  


  const [folderChain, SetFolderChain] = useState([{ id: '/', name: 'Home', isDir: true, openable:true},]);
  var   [curDirPath, SetCurDirPath] = useState("");
  const [currentBucket, SetCurrentBucket] = useState("space-for-testing-the-nutil-web-applicat");
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
      
      currentBucket={currentBucket}
      ></JobProcessor>

      </div>

  );
  }


export default App;

  // };
  