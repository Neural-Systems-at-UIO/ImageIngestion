
import "./App.css";
import React, { useEffect, useState } from "react";
import MyChonkyTable from "./MyChonkyTable";
import JobProcessor from "./JobProcessor";






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
