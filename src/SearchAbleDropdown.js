import { Select } from 'antd';

import React, { useEffect, useState } from 'react';
import { ListBucketFiles } from "./ButtonActions";





function getUserRoles(token) {
  

  return new Promise((resolve, reject) => {
    if (token == null) {
      
      reject('token is null');
      return null;
    }
    else  {
      
      
    // make request to getUser
    var xhr = new XMLHttpRequest();
    if (process.env.NODE_ENV === "development") {
      var target_url = process.env.REACT_APP_DEV_URL;
    } else {
      var target_url = process.env.REACT_APP_PROD_URL;
    }
    
    xhr.open("GET", target_url+ "/getuserroles", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", token);
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var user = xhr.responseText;
        user = JSON.parse(user);
                  
        resolve(user);
      }
      else {
        
      }
  }
}
});
};

function setDropdownOptions(collabs, setOptions) {
  var options = [];
  for (var i = 0; i < collabs.length; i++) {
    options.push({
      label: collabs[i],
      value: collabs[i],
    });
  }
  setOptions(options);
}

function SearchAbleDropdown( params ) {
  

  var token = params.token;
  var currentBucket = params.currentBucket;
  var SetCurrentBucket = params.SetCurrentBucket;
  var [options, setOptions] = useState(


    [
      { label: currentBucket, value: currentBucket},
    ]
  );
  
  useEffect(() => {
    getUserRoles(token).then((user) => {
    setDropdownOptions(user, setOptions)
    })
    .catch((err) => {
      
    })
    ;
  }, [token]);

  return(
  <div
  style={{
    // width: 200,
    position: "absolute",
    top: '0.6rem',
    right: '2.5rem',
  }}
  >
  <label>Current Bucket:  &nbsp; </label>
  <Select
  defaultValue={currentBucket}
    showSearch
    style={{
      width: 200,
 
    }}
    // set label with currentBucket

    placeholder="Search to Select"
    optionFilterProp="children"
    onChange={(value) => {
      currentBucket = value;
      SetCurrentBucket(value);
      ;
      ListBucketFiles(
        params.setFiles,
        currentBucket,
        params.curDirPath,
        token
      );
    }}
    // set value with currentBucket

    filterOption={(input, option) => (option?.label ?? '').includes(input)}
    filterSort={(optionA, optionB) =>
      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
    }
    options={options}
    
  />
  </div>
  )
}
export default SearchAbleDropdown;