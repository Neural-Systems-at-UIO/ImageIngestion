
import "./App.css";
import React, { useEffect, useState } from "react";
import MyChonkyTable from "./MyChonkyTable";
import JobProcessor from "./JobProcessor";











var returnStatus = "";


// function pollJobStatus(
//   jobID,
//   SetMessage,
//   SetProgressValue,
//   SetCurrentImage,
//   SetTotalImage,
//   SetProgressImage
// ) {
//   var xhr = new XMLHttpRequest();
//   if (process.env.NODE_ENV === "development") {
//     var target_url = process.env.REACT_APP_DEV_URL;
//   }
//   else {
//     var target_url = process.env.REACT_APP_PROD_URL;
//   }
//   xhr.open("GET", `${target_url}/jobStatus?jobID=` + jobID, true);
//   // add query string
//   if (returnStatus == "Done") {
//     returnStatus = "";
//     clearInterval(poller);
//     return;
//   }

//   xhr.send();
//   xhr.onreadystatechange = function () {
//     if (xhr.status == 200 && xhr.readyState == 4) {
//       var jobStatus = xhr.responseText;
//       jobStatus = JSON.parse(jobStatus);
//       returnStatus = jobStatus["status"];
//       SetProgressValue(jobStatus["progress"]);
//       SetCurrentImage(jobStatus["current_image"]);
//       SetTotalImage(jobStatus["total_images"]);
//       var progressImages =
//         (jobStatus["current_image"] / jobStatus["total_images"]) * 100;
//       SetProgressImage(progressImages);
//       SetMessage(jobStatus["status"]);
//     }
//   };
// }
var poller = "";
var poller_status = "";


var jobID = "";

function App() {

  const [folderChain, SetFolderChain] = useState([{ id: '/', name: 'Home', isDir: true, openable:true},]);
  var [curDirPath, SetCurDirPath] = useState("");




  const [files, setFiles] = useState([null]);











  function getUser() {
    var user_nid = "";
    return new Promise((resolve, reject) => {
      // make request to getUser
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "https://localhost:8080/getuser", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", token);
      xhr.send();
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
          var user = xhr.responseText;
          user = JSON.parse(user).data;
          user_nid = user["https://schema.hbp.eu/users/nativeId"];
          
          resolve(user);
        }
    }
  });
  };
  
  




  
  return (
    <div>

      <MyChonkyTable  files={files} setFiles = {setFiles} folderChain = {folderChain} SetFolderChain={SetFolderChain} curDirPath={curDirPath} SetCurDirPath={SetCurDirPath}></MyChonkyTable>
      <JobProcessor></JobProcessor>

      </div>

  );
  }


export default App;
