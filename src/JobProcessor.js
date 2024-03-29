
import "./JobProcessor.css";
import { LoadingOutlined, CheckOutlined } from '@ant-design/icons';

import { Progress, Button, Menu, Popover, Input, Modal, Select, Tooltip} from "antd";
import React, { useEffect, useState } from "react";
// handle imports for the websocket
import useWebSocket, { ReadyState } from "react-use-websocket";

console.log(process.env.NODE_ENV)
// websocket is on a middleware server with the address http://localhost:8080/websocket
// this is the address of the websocket server

var WS_URL = process.env.REACT_APP_WS_URL;
// production 
if (process.env.NODE_ENV === "development") {
  var WS_URL = process.env.REACT_APP_WS_URL;
}
else {

  var WS_URL = "wss://tif-dzi-tar-svc-test.apps.hbp.eu" + '/ws'
}

console.log(WS_URL)




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
  return new Promise((resolve, reject) => {
  let redirect_uri = process.env.REACT_APP_URL;

  if (process.env.NODE_ENV === 'development') {
    xhr.open("GET", `${redirect_uri}/listBucket?bucketName=${bucket_name}&folderName=.nesysWorkflowFiles/alignmentJsons/`, true);
  } else {
    xhr.open("GET", "/listBucket?bucketName=" + bucket_name + "&folderName=.nesysWorkflowFiles/alignmentJsons/", true);
  }
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
          var array = { 'brainID': brainID, 'jobID': brainID, 'status': 'finalised', 'progress': 100, 'total_images': 0, 'current_image': 0 }
          items = AddToItems(setItems, items, array, 'Prepared Brains')
        }
      }
      resolve(items)
    } else {
      console.log("Error: ", xhr.status);
      console.log(xhr.responseText);
      reject(xhr.responseText)
    }
  };
});

}




function MessageBox(props) {

  if (props.TotalImage == props.CurrentImage && props.TotalImage != 0) {
    var head = "Brain Created"
    var body = ""
  }
  else if (props.TotalImage == 0) {
    var head = "Select Images and create your brain"
    var body = "Use shift or ctrl to select multiple images"
  } else {
    var head = "Creating your brain"
    var body = ""
  }

  return (
    // center the content
    <div id="MessageBox">
      <Progress
        id="Progress"
        type="circle"
        percent={props.ProgressImage}
        format={() => `${props.CurrentImage}/${props.TotalImage}`}
      ></Progress>
      <Progress id="Progress"
        type="circle"
        percent={props.ProgressValue}
      ></Progress>
      <div
        id="currentStatus"

      >

        <div>
        <h2 >{head}</h2>
        <p >{body}</p>
        </div>
        <div id="messageAndViewer">
          <p>{props.message}</p>
          {/* conditionally render a button */}
          {/* pass an argument the onclick function */}
          {props.TotalImage == props.CurrentImage && props.TotalImage != 0 ? <Button id="viewBrain"

            type="primary" onClick={
              () => {
                openViewerInNewTab(props.CurrentBucket, props.CurrentJob)
              }
            }>View Brain</Button> : null}
        </div>

      </div>


    </div>
  );
}

function openViewerInNewTab(bucket_name, brain_id) {
  console.log(bucket_name)
  let viewer_url = "https://miosdv.apps-dev.hbp.eu/index.html?bucket="
  let apiUrl = "https://tar-svc-test.apps.hbp.eu/fakebucket/?url=https://data-proxy.ebrains.eu/api/v1/buckets/" + bucket_name + "?prefix=.nesysWorkflowFiles/zippedPyramids/" + brain_id
  // open the viewer in a new tab
  window.open(viewer_url + apiUrl, "_blank");
}
// write an arrow function called clickCreateBrain that runs on button click
function CreateBrain(props) {
  const [brainId, setBrainId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const click = () => {
    // get the button with title "Generate Brain from Files"
    var button = document.querySelector('[title=" "]');
    button.click();

    setIsModalOpen(false);
  // reset the brainId and targetAtlas input fields
  setBrainId('');
  props.setSelectedAtlas('');
  };

  const inputClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleBrainIdChange = (e) => {
    setBrainId(e.target.value);
  };

 

  const handleAtlasChange = (value) => {
    console.log(`selected ${value}`)
    props.setSelectedAtlas(value);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const isDisabled = !brainId || !props.selectedAtlas || brainId.includes(" ") || brainId.includes("/") || !/^[a-zA-Z0-9]+$/.test(brainId);
    //  render different tooltip based on props.createBrainActive
  function tooltipButton(props) {
    if (props.createBrainActive) {
      return (
          <Button
            type="primary"
            onClick={inputClick}
            disabled={!props.createBrainActive}
          >
            <span id="brainEmoji">🧠</span>&nbsp; &nbsp; Create Brain From
            Selection
          </Button>
      );
    } else {
      return (
        <Tooltip title="Please select files to create a brain">
          <Button
            type="primary"
            onClick={inputClick}
            disabled={!props.createBrainActive}
          >
            <span id="brainEmoji">🧠</span>&nbsp; &nbsp; Create Brain From
            Selection
          </Button>
        </Tooltip>
      );
    }
  }
  return (
    <>
        <span>

          {tooltipButton(props)}
      </span>
      <Modal title="Please provide some information about your brains" open={isModalOpen} onOk={click} onCancel={handleModalCancel} okButtonProps={{ disabled: isDisabled }}>
<div style={{ display: 'flex', alignItems: 'center' }}>
  <label htmlFor="brainIDInput" style={{ width: '7.5rem' }}>Brain ID:</label>
  <Input id="brainIDInput" placeholder="Enter Id for Brain" value={brainId} onChange={handleBrainIdChange}  pattern="[^\s]+"/>
  </div>

  {brainId.includes(" ") && <span style={{ color: 'red' }}>No spaces allowed</span>}
  {brainId.includes("/") && <span style={{ color: 'red' }}>No slashes allowed</span>}
  {!/^[a-zA-Z0-9_\-]*$/.test(brainId) && !brainId.includes(" ") && !brainId.includes("/") && <span style={{ color: 'red' }}>No special characters allowed</span>}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
          <label htmlFor="target-atlas">Target Atlas:</label>
          <Select id="targetAtlas" value={props.selectedAtlas} onChange={handleAtlasChange} style={{ marginLeft: '1rem', width: '23.5rem' }}>
            <Option value="WHS SD Rat v4 39um">WHS SD Rat v4 39um</Option>
            <Option value="WHS_SD_Rat_v3_39um">WHS_SD_Rat_v3_39um</Option>
            <Option value="ABA_Mouse_CCFv3_2017_25um">ABA_Mouse_CCFv3_2017_25um</Option>
          </Select>
        </div>
      </Modal>
    </>
  );
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
  let redirect_uri = process.env.REACT_APP_URL;
if (process.env.NODE_ENV === 'development') {
  xhr.open("GET", `${redirect_uri}/jobStatus?jobID=` + jobID + `&bucketName=${bucket_name}`, true);
  // add query string
} else {
  // run appropriate version for deployment
  xhr.open("GET", `/jobStatus?jobID=` + jobID + `&bucketName=${bucket_name}`, true);
}
  // add token to header
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.staus == 500 && xhr.readyState == 4) {
      return
    }
    if (xhr.status == 200 && xhr.readyState == 4) {
      var jobStatus = xhr.responseText;

      jobStatus = JSON.parse(jobStatus);
      console.log(jobStatus)

      var returnStatus = jobStatus["status"];
      SetProgressValue(jobStatus["progress"]);
      SetCurrentImage(jobStatus["current_image"]);
      SetTotalImage(jobStatus["total_images"]);
      var progressImages =
        (jobStatus["current_image"] / jobStatus["total_images"]);
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
    let redirect_uri = process.env.REACT_APP_URL;
    console.log('redirect_uri', redirect_uri)

    if (process.env.NODE_ENV === 'development') {
      xhr.open("GET", `${redirect_uri}/getUser`, true);
      // add query string
    } else {
      // run appropriate version for deployment
      xhr.open("GET", `/getUser`, true);
    }
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


function updateJobList(setItems, items, job, SetCurrentJob, setSelectedKeys, handleMenuClick) {
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
    setSelectedKeys([job.jobID])

    let tempvalue = { key: job.jobID, keyPath: [job.jobID,job.jobID], children: [] }
    handleMenuClick(tempvalue)

  }

  if (job.current_image == job.total_images) {
    if (whereIsTheJob == 'Processing') {
      // remove from processing
      processChild = items[0].children.findIndex(x => x.key == job.jobID)
      // make processChild an int
      processChild = parseInt(processChild)
      items[0].children.splice(processChild, 1)

      // we no longer need to look for jobs in server with the uuid and instead switch to checking the bucket for the brainid
      job.jobID = job.brainID
      SetCurrentJob(job.brainID)


      // items = items
      setItems(items)
    }
    items = AddToItems(setItems, items, job, "Prepared Brains")
    setSelectedKeys([job.jobID])
  }
  console.log('before we set')
  setItems(items)
  return items
}

function JobProcessor(props) {
  var bucket_name = props.currentBucket;
  console.log('bucket_name: ', bucket_name)
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
  const [jobUpdateVar, setJobUpdateVar] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(['1']);

  var CurrentJob = props.CurrentJob;
  var SetCurrentJob = props.SetCurrentJob;
  // SetCurrentJob('testing123')
  // const [user, setUser] = useState(null);
  console.log('CurrentJob test: ', CurrentJob)
  const {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(WS_URL, {
    onOpen: () => {
      console.log('opened websocket')
      // add a listener to the websocket
      getWebSocket().addEventListener("message", (event) => {
        console.log('event')
        console.log(event);
        var data = JSON.parse(event.data);
        console.log(data)
        if (data.JobUpdate) {
          var job = data.JobUpdate;



          console.log('jobID: ', job.jobID)

          console.log((job.jobID == data.CurrentJob))

          console.log('CurrentJob: ', data.CurrentJob)


          if (job.jobID == data.CurrentJob) {
            SetProgressValue(job.progress);
            SetCurrentImage(job.current_image);
            SetTotalImage(job.total_images);
            var progressImages =
              (job.current_image / job.total_images);
            SetProgressImage(progressImages * 100);
            SetMessage(job.status);

          }

          setJobUpdateVar(job)

        }
      });


    }
  });
  function handleMenuClick(value) {
    CurrentJob = value.key;
    var keyPath = value.keyPath[1];
    console.log('keypath', value.keyPath);
    setSelectedKeys(value.keyPath);

    SetCurrentJob(CurrentJob);
    sendMessage(JSON.stringify({ "CurrentJob": CurrentJob, "KeyPath": keyPath }));
  }
  useEffect(() => {
    if (jobUpdateVar != false) {
      console.log('runnign effect')
      items = updateJobList(setItems, items, jobUpdateVar, SetCurrentJob, setSelectedKeys, handleMenuClick)
    }
  }, [jobUpdateVar])


  useEffect(() => {
    if (props.token != null) {
      getUser(props.token).then((user) => {
        var user = user.data
        user.CurrentBucket = bucket_name
        sendMessage(JSON.stringify({ "user": user }));

      })
        ;
    }
  }, [props.token]);

  useEffect(() => {
    if (props.token != null) {
      sendMessage(JSON.stringify({ "CurrentBucket": bucket_name }));
      var items = [
        getItem('Processing', 'sub1', '', []),
        getItem('Prepared Brains', 'sub2', '', [])
      ];
      listFinalisedBrains(bucket_name, setItems, items, props.token).then((items) => {
        checkForRunningJobs(items, setItems, bucket_name);
      });
    }
  }, [bucket_name, props.token]);







  useEffect(() => {
    if (CurrentJob != null) {
      pollJobStatus(CurrentJob, bucket_name, SetMessage, SetProgressValue, SetCurrentImage, SetTotalImage, SetProgressImage, props.token)
    }
  }, [CurrentJob]);


  useEffect(() => {

    // setInterval(
    //   checkForRunningJobs,
    //   1000,
    //   items,
    //   setItems,
    //   bucket_name
    // );

  }, [bucket_name]);
  console.log('total images: ', TotalImage)
  console.log('createBrainActive: ', props.createBrainActive)
  return (
    <div id="jobMenu" style={{minHeight:'10vh'}}>
      <div>

        <CreateBrain setSelectedAtlas={props.setSelectedAtlas} selectedAtlas={props.selectedAtlas} setSelectedKeys={setSelectedKeys} handleMenuClick={handleMenuClick} items={items} createBrainActive={props.createBrainActive}/>

        <div id="jobScrollColumn">

          <Menu
            onClick={handleMenuClick}


            selectedKeys={selectedKeys}
            defaultOpenKeys={['sub1', 'sub2']}
            mode="inline"
            items={items}
          />


        </div>
      </div>
      <div>
        <MessageBox message={Message} ProgressValue={ProgressValue} SetProgressValue={SetProgressValue} ProgressImage={ProgressImage} SetProgressImage={SetProgressImage} TotalImage={TotalImage} SetTotalImage={SetTotalImage} CurrentImage={CurrentImage} SetCurrentImage={SetCurrentImage} CurrentBucket={bucket_name} CurrentJob={CurrentJob} />
      </div>
    </div>
  );
}





function AddToItems(setItems, items, job, state) {

  var item_name = job.brainID
  var itemID = job.jobID
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
  setItems(items)
  return items
}


function checkForRunningJobs(items, setItems, bucket_name) {
  var xhr = new XMLHttpRequest();
  // bucket_name = urlParams.get("clb-collab-id")
  let redirect_uri = process.env.REACT_APP_URL;
  console.log('test')
  console.log('NODE ENV', process.env.NODE_ENV)
  if (process.env.NODE_ENV == "development") {

    xhr.open("GET", `${redirect_uri}/checkForRunningJobs?bucketName=${bucket_name}`, true);
    xhr.send();
  }
  else {
    xhr.open("GET", `/checkForRunningJobs?bucketName=${bucket_name}`, true);
    xhr.send();
  }

  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      var jobs = xhr.responseText;
      console.log('NODE ENV', process.env.NODE_ENV)

      console.log('jobs', jobs) 
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
            // jobs[i].jobID = jobs[i].brainID

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


