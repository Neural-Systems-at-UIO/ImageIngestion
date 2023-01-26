// import { token } from "./App";

export function DownloadFiles(fileActionDispatch, token) {
  
  var selectedFiles = fileActionDispatch.state.selectedFilesForAction;
  
  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const xhr = new XMLHttpRequest();
    // get request to download file
    xhr.open("GET", `https://data-proxy.ebrains.eu/api/v1/buckets/space-for-testing-the-nutil-web-applicat/${file.id}?redirect=false`, true);
    
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("x-amz-date", new Date().toUTCString());
    // log request
    
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        // return file as blob
        // create a link to download the file
        var link = document.createElement("a");
        // parse response
        var url = JSON.parse(xhr.responseText);

        link.href = url.url;
        link.download = file.name;
        link.click();
      }
    };
  }
}
export function DeleteFiles(fileActionDispatch, curDirPath, setFiles, token) {
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
        

        ListBucketFiles(
          setFiles,
          "space-for-testing-the-nutil-web-applicat",
          curDirPath
        );
      } else {
        // log error
        
        

      }
    };
  }
}
export function UploadFiles(curDirPath, setFiles, token) {
  const fileInput = document.getElementById("fileUpload");
  fileInput.click();
  fileInput.addEventListener("change", (e) => {
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      const xhr = new XMLHttpRequest();
      
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
          
          
          // convert to json
          target_url = JSON.parse(target_url);
          target_url = target_url.url;
          
          
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
              

              ListBucketFiles(
                setFiles,
                "space-for-testing-the-nutil-web-applicat",
                curDirPath
              );
            } else {
              // log error
              
              

            }
          };

        } else {
          // log error
          
        }
      };
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
  } else if (Object.keys(file).includes("name")) {
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
export function ListBucketFiles(setFiles, bucket_name, folder_name, token) {

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
