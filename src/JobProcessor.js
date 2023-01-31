
import { LoadingOutlined, CheckOutlined } from '@ant-design/icons';

import { Progress, Button, Menu, Popover, Input } from "antd";
import BrainList from "./BrainList"
import React, { useEffect, useState } from "react";
// handle imports for the websocket
import useWebSocket, { ReadyState } from "react-use-websocket";

console.log(process.env.NODE_ENV)
// handle requests for the websocket
if (process.env.NODE_ENV === "development") {
  console.log("this works")
  var WS_URL = "ws://localhost:8083";
}
else {
  var WS_URL =  ":8083"
}

console.log("WS_URL: ", WS_URL)




function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

function listFinalisedBrains(bucket_name, setItems, items, token) {
  const xhr = new XMLHttpRequest();
  if (process.env.NODE_ENV === "development") {
    var target_url = process.env.REACT_APP_DEV_URL;
  } else {
    var target_url = process.env.REACT_APP_PROD_URL;
  }
  xhr.open(
    "GET",
    `${target_url}/listBucket?bucketName=${bucket_name}&folderName=.nesysWorkflowFiles/alignmentJsons/`,
    true
  );
  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
  xhr.send();
  xhr.onload = function () {
    if (xhr.status === 200 && xhr.readyState === 4) {
      var response = JSON.parse(xhr.responseText);
      console.log('----------------------------------')
      for (var i = 0; i < response.objects.length; i++) {
        if (response.objects[i].name.endsWith('.waln')) {
          var data = response.objects[i].name.split('/')
          // get last element
          var brainID = data[data.length - 1].split('.')[0]
          var array = {'brainID': brainID, 'jobID': brainID, 'status': 'finalised', 'progress': 100, 'total_images': 0, 'current_image': 0}
          items = AddToItems(setItems, items, array, 'Prepared Brains')
        }
      }
    } else {
      console.log("Error: ", xhr.status);
      console.log(xhr.responseText);
    }
  };

}


// function AddToItems(setItems, items, job, state) {

//   var item_name = job.brainID
//   var itemID =  job.jobID
//   console.log('job', job)
//   var new_list = []
//   for (var i in items) {
//     var item_list = []
//     if (items[i].label == "Processing") {
//       var icon = <LoadingOutlined />
//     }
//     else {
//       var icon = <CheckOutlined />
//     }
//     if (items[i].label == state) {
//       if (items[i].children) {
//         var newEntry = getItem(item_name, itemID, icon)
        
//         newEntry['current_image'] = job.current_image
//         newEntry['total_images'] = job.total_images
//         newEntry['progress'] = job.progress
//         newEntry['status'] = job.status



function MessageBox(props) {
  if (props.TotalImage == 0) {
    var head = "Select Images and create your brain"
  } else {
    var head = "Creating your brain"
  }
  return (
    // center the content
    <div style={{
      display: "flex",

      padding: "5rem 0rem 0rem 5rem",

    }}>
      <Progress
        type="circle"
        percent={props.ProgressImage}
        style={{ padding: "0.5rem" }}
        format={() => `${props.CurrentImage}/${props.TotalImage}`}
      ></Progress>
      <Progress
        type="circle"
        percent={props.ProgressValue}
        style={{ padding: "0.5rem" }}
      ></Progress>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "0.5rem",
        }}
      >

        <h2>{head}</h2>
        <p>{props.message}</p>
      </div>
    </div>
  );
}

// write an arrow function called clickCreateBrain that runs on button click
function CreateBrain() {
  const click = () => {
    // get the button with title "Generate Brain from Files"
    var button = document.querySelector('[title=" "]');
    ;

    button.click();
    var popover = document.querySelector('.ant-popover');
    //   popover.style.display = "none";

  };
  const inputClick = (e) => {
    var popover = document.querySelector('.ant-popover');
    // display the popover
    // popover.style.display = "block";

    e.preventDefault();
    e.stopPropagation();
    // temp close the popover until its clicked again




  }

  var title = "Enter Id for Brain"
  var content = <div style={{ display: "flex" }}><Input id="brainIDInput" placeholder="Enter Id for Brain" onClick={inputClick} />&nbsp; <Button type="primary" onClick={click}>OK</Button></div>
  return <Popover placement="topLeft" trigger="click" content={content} title={title}>
    <Button type="primary" style={{ width: '100%' }}>
      <span style={{ 'textShadow': '0px 0px 9px white' }}>🧠</span>&nbsp; &nbsp; Create Brain From Selection
    </Button>
  </Popover>;
}

function pollJobStatus(
  jobID,
  bucket_name,
  SetMessage,
  SetProgressValue,
  SetCurrentImage,
  SetTotalImage,
  SetProgressImage,
  token
) {

  var xhr = new XMLHttpRequest();
  if (process.env.NODE_ENV === "development") {
    var target_url = process.env.REACT_APP_DEV_URL;
  }
  else {
    var target_url = process.env.REACT_APP_PROD_URL;
  }
  xhr.open("GET", `${target_url}/jobStatus?jobID=` + jobID + `&bucketName=${bucket_name}`, true);
  // add query string

  // add token to header
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      var jobStatus = xhr.responseText;

      jobStatus = JSON.parse(jobStatus);
      console.log(jobStatus)

      var returnStatus = jobStatus["status"];
      SetProgressValue(jobStatus["progress"]);
      SetCurrentImage(jobStatus["current_image"]);
      SetTotalImage(jobStatus["total_images"]);
      var progressImages =
        (jobStatus["current_image"] / jobStatus["total_images"]) ;
      SetProgressImage(progressImages * 100);
      SetMessage(jobStatus["status"]);
      if (returnStatus == "Done") {
        returnStatus = "";
        return;
      }
    }
  };
}


// var poller = null
function getUser(token) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    if (process.env.NODE_ENV === "development") {
      var target_url = process.env.REACT_APP_DEV_URL;
    }
    else {
      var target_url = process.env.REACT_APP_PROD_URL;
    }
    xhr.open("GET", `${target_url}/getuser`, true);
    // add authorization header
    xhr.setRequestHeader("Authorization", token);
    xhr.send();
    xhr.onreadystatechange = function () {
      if (xhr.status == 200 && xhr.readyState == 4) {
        var user = xhr.responseText;
        user = JSON.parse(user);
        resolve(user);
      }
      if (xhr.status == 400 && xhr.readyState == 4) {
        reject("Error");
      }
    };
  }

  );

}


function updateJobList(setItems, items, job) {
  var whereIsTheJob = 'Nowhere'
  for (var processChild in items[0].children) {
    if (items[0].children[processChild].key == job.jobID) {
      whereIsTheJob = 'Processing'
      break
    }
  }
  for (var PreparedChild in items[1].children) {
    if (items[1].children[PreparedChild].key == job.jobID) {
      whereIsTheJob = 'Prepared Brains'
      break
    }
  }
  if (whereIsTheJob == 'Nowhere') {
    items = AddToItems(setItems, items, job, "Processing")
  }

  if (job.current_image == job.total_images) {
    if (whereIsTheJob == 'Processing') {
      // remove from processing
      processChild = items[0].children.findIndex(x => x.key == job.jobID)
      // make processChild an int
      processChild = parseInt(processChild)
      items[0].children.splice(processChild, 1)
      // items = items
      setItems(items)
    }
    items = AddToItems(setItems, items, job, "Prepared Brains")
  }
  setItems(items)
  return items
}

function JobProcessor(props) {
  var bucket_name = props.currentBucket;
  console.log('bucket_name: ',bucket_name)
  var [items, setItems] = useState([
    getItem('Processing', 'sub1', '', [
    ]
    ),
    getItem('Prepared Brains', 'sub2', '', [
    ])

  ]);
  const [Message, SetMessage] = useState("");
  const [ProgressValue, SetProgressValue] = useState(0);
  const [ProgressImage, SetProgressImage] = useState(0);
  const [TotalImage, SetTotalImage] = useState(0);
  const [CurrentImage, SetCurrentImage] = useState(0);

  var CurrentJob = props.CurrentJob;
  var SetCurrentJob = props.SetCurrentJob;
  // SetCurrentJob('testing123')
  // const [user, setUser] = useState(null);
  console.log('CurrentJob test: ',CurrentJob)
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(WS_URL , {
    onOpen: () => {
      console.log('opened')
      // add a listener to the websocket
      getWebSocket().addEventListener("message", (event) => {
        console.log('event')
        console.log(event);
        var data = JSON.parse(event.data);
        console.log(data)
        if (data.JobUpdate) {
          var job = data.JobUpdate;

          

          console.log('jobID: ',job.jobID)

          console.log((job.jobID == data.CurrentJob))

          console.log('CurrentJob: ',data.CurrentJob)


          if (job.jobID == data.CurrentJob) {
            SetProgressValue(job.progress);
            SetCurrentImage(job.current_image);
            SetTotalImage(job.total_images);
            var progressImages =
              (job.current_image / job.total_images) ;
            SetProgressImage(progressImages * 100);
            SetMessage(job.status);
            // if (returnStatus == "Done") {
            //   returnStatus = "";
              
            // }
          }


          
          items = updateJobList(setItems, items, job)
        }
      });


    }
  });



  useEffect(() => {
    getUser(props.token).then((user) => {
      var user = user.data
      user.CurrentBucket = bucket_name
      sendMessage(JSON.stringify({ "user": user }));

    })
    ;
    listFinalisedBrains(bucket_name, setItems, items, props.token);

  }, [props.token]);





  useEffect(() => {
    if (CurrentJob != null) {
      pollJobStatus(CurrentJob,bucket_name, SetMessage, SetProgressValue, SetCurrentImage,  SetTotalImage, SetProgressImage, props.token )
    }
    }, [CurrentJob]);
      
      
  useEffect(() => {
    sendMessage(JSON.stringify({ "CurrentBucket": bucket_name}));
    checkForRunningJobs(items, setItems, bucket_name);
    // setInterval(
    //   checkForRunningJobs,
    //   1000,
    //   items,
    //   setItems,
    //   bucket_name
    // );

  }, [bucket_name]);
  console.log('total images: ',TotalImage)
  return (
    <div style={{ display: "flex" }}>
      <div>

        <CreateBrain />

        <div style={{ "overflowY": scroll, "maxHeight": "70vh", overflow: 'scroll' }}>

        <Menu
          onClick={(value) => {
            CurrentJob = value.key;
            var keyPath = value.keyPath[1]
            
            SetCurrentJob(CurrentJob);
            sendMessage(JSON.stringify({ "CurrentJob": CurrentJob , "KeyPath": keyPath}));
          }
          }
          style={{
              width: 256,
              "minHeight":"40vh" 
          }}
          defaultSelectedKeys={['1']}
          defaultOpenKeys={['sub1', 'sub2']}
          mode="inline"
          items={items}
          />


        </div>
      </div>
      <div style={{}}>
        <MessageBox message={Message} ProgressValue={ProgressValue} SetProgressValue={SetProgressValue} ProgressImage={ProgressImage} SetProgressImage={SetProgressImage} TotalImage={TotalImage} SetTotalImage={SetTotalImage} CurrentImage={CurrentImage} SetCurrentImage={SetCurrentImage} />
      </div>
    </div>
  );
}





function AddToItems(setItems, items, job, state) {

  var item_name = job.brainID
  var itemID =  job.jobID
  console.log('job', job)
  var new_list = []
  for (var i in items) {
    var item_list = []
    if (items[i].label == "Processing") {
      var icon = <LoadingOutlined />
    }
    else {
      var icon = <CheckOutlined />
    }
    if (items[i].label == state) {
      if (items[i].children) {
        var newEntry = getItem(item_name, itemID, icon)
        
        newEntry['current_image'] = job.current_image
        newEntry['total_images'] = job.total_images
        newEntry['progress'] = job.progress
        newEntry['status'] = job.status
      }
      else {
        // var newEntry = getItem(item_name, 1)
      }
      // set key to length of children + 1
      item_list = item_list.concat(newEntry)
    }
    if (items[i].children) {
      for (var child in items[i].children) {
        var newEntry = getItem(items[i].children[child].label, items[i].children[child].key, icon)
        newEntry['current_image'] = job.current_image
        newEntry['total_images'] = job.total_images
        newEntry['progress'] = job.progress
        newEntry['status'] = job.status
        item_list = item_list.concat(newEntry)
      }
    }
    // add item_list to new_list
    new_list = new_list.concat(getItem(items[i].label, items[i].key, '', item_list))


  }



  items = new_list
  console.log('items', items)
  setItems(items)
  return items
}


function checkForRunningJobs(items, setItems, bucket_name) {
  var xhr = new XMLHttpRequest();
  // bucket_name = urlParams.get("clb-collab-id")
  if (process.env.NODE_ENV === "development") {
    var target_url = process.env.REACT_APP_DEV_URL;
  }
  else {
    var target_url = process.env.REACT_APP_PROD_URL;
  }
  xhr.open("GET", `${target_url}/checkForRunningJobs?bucketName=${bucket_name}`, true);
  xhr.send();

  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      var jobs = xhr.responseText;
      jobs = JSON.parse(jobs)
      console.log('jobs..', jobs)
      for (var i in jobs) {


        var skip = false

        for (var j in items[0].children) {
          if (jobs[i].jobID == items[0].children[j].key && jobs[i].status != 'Done') {
            var skip = true
          }
          if (jobs[i].jobID == items[0].children[j].key && jobs[i].status == 'Done') {
            // remove item from processing
            items[0].children.splice(j, 1)
          }
        }
        for (var m in items[1].children) {
          if (jobs[i].jobID == items[1].children[m].key && jobs[i].status == 'Done') {
            var skip = true
          }
        }
        if (skip == false) {

          if (jobs[i].current_image == jobs[i].total_images) {
            // remove item from processing
            items[0].children.splice(j, 1)

            items = AddToItems(setItems, items, jobs[i], "Prepared Brains")


          }
          else {
            items = AddToItems(setItems, items, jobs[i], "Processing")
          }
        } 

      }

    }
  };
}
export default JobProcessor;


