
import { LoadingOutlined , CheckOutlined } from '@ant-design/icons';

import { Progress, Button, Popover, Input} from "antd";
import BrainList from "./BrainList"
import React, { useEffect, useState } from "react";


function getItem(label, key, icon, children, type) {
    return {
      key,
      icon,
      children,
      label,
      type,
    };
  }
  
  
  
  function MessageBox(props) {
    if (props.TotalImage == 0) {
        var head = "Select Images and create your brain"
    } else {
        var head = "Creating your brain"
    }
    return (
      // center the content
      <div style={{ display: "flex",

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
      console.log("clicking")
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
    var content = <div style={{display:"flex"}}><Input id="brainIDInput" placeholder="Enter Id for Brain" onClick={inputClick} />&nbsp; <Button type="primary" onClick={click}>OK</Button></div>
    return <Popover placement="topLeft" trigger="click" content={content} title={title}>
    <Button type="primary" style={{width:'100%'}}>
      <span style={{'textShadow': '0px 0px 9px white'}}>🧠</span>&nbsp; &nbsp; Create Brain From Selection
    </Button>
    </Popover>;
  }

  function pollJobStatus(
  jobID,
  SetMessage,
  SetProgressValue,
  SetCurrentImage,
  SetTotalImage,
  SetProgressImage
) {
    console.log("polling job status" + jobID)
  var xhr = new XMLHttpRequest();
  if (process.env.NODE_ENV === "development") {
    var target_url = process.env.REACT_APP_DEV_URL;
  }
  else {
    var target_url = process.env.REACT_APP_PROD_URL;
  }
  xhr.open("GET", `${target_url}/jobStatus?jobID=` + jobID, true);
  // add query string


  xhr.send();
  xhr.onreadystatechange = function () {
    if (xhr.status == 200 && xhr.readyState == 4) {
      var jobStatus = xhr.responseText;
      jobStatus = JSON.parse(jobStatus);
      var returnStatus = jobStatus["status"];
      SetProgressValue(jobStatus["progress"]);
      SetCurrentImage(jobStatus["current_image"]);
      SetTotalImage(jobStatus["total_images"]);
      var progressImages =
        (jobStatus["current_image"] / jobStatus["total_images"]) * 100;
      SetProgressImage(progressImages);
      SetMessage(jobStatus["status"]);
      if (returnStatus == "Done") {
        returnStatus = "";
        return;
    }
    }
  };
}

var poller = null

function JobProcessor() {
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
const [CurrentJob, SetCurrentJob] = useState(null);

function restartPoller() {
    if (CurrentJob != null) {
        pollJobStatus( CurrentJob,
            SetMessage,
            SetProgressValue,
            SetCurrentImage,
            SetTotalImage,
            SetProgressImage
            )
        clearInterval(poller);
        poller = setInterval(
            pollJobStatus,
            1000,
            CurrentJob,
            SetMessage,
            SetProgressValue,
            SetCurrentImage,
            SetTotalImage,
            SetProgressImage
            ) ;
    }
}

useEffect(() => {
    console.log("CurrentJob", CurrentJob);
    restartPoller();

}, [CurrentJob]);



useEffect(() => {
    checkForRunningJobs(items, setItems);
    setInterval(
      checkForRunningJobs,
      1000,
      items,
      setItems,
    );
  
  }, []);

return (
    <div style={{ display: "flex" }}>
    <div>

<CreateBrain />

      <div style={{"overflowY": scroll,  "maxHeight": "70vh" , overflow:'scroll'}}>
      <BrainList items={items} SetCurrentJob={SetCurrentJob} />
      </div>
    </div>
    <div style={{}}>
    <MessageBox message={Message} ProgressValue={ProgressValue} SetProgressValue={SetProgressValue} ProgressImage={ProgressImage} SetProgressImage={SetProgressImage} TotalImage={TotalImage} SetTotalImage={SetTotalImage} CurrentImage={CurrentImage} SetCurrentImage={SetCurrentImage}/>
    </div>
    </div>
);
}

function AddToItems(setItems, items, item_name, itemID, state) {


    var new_list = []
      for (var i in items) {
        var item_list = []
        if (items[i].label =="Processing")  {
          var icon = <LoadingOutlined />
        }
        else {
          var icon = <CheckOutlined />
        }
        if (items[i].label == state) {
          if (items[i].children) {
          var newEntry = getItem(item_name, itemID, icon)
          }
          else {
            // var newEntry = getItem(item_name, 1)
          }
          // set key to length of children + 1
          item_list = item_list.concat(newEntry)
        }
        if (items[i].children) {
        for (var child in items[i].children) {
          var newEntry = getItem(items[i].children[child].label, items[i].children[child].key,icon)
          item_list = item_list.concat(newEntry)
        }
      }
        // add item_list to new_list
        new_list = new_list.concat(getItem(items[i].label, items[i].key,'', item_list))
        
  
    }
    
  
    
    items = new_list
    setItems(items)
    return items
    }


function checkForRunningJobs(items, setItems, bucket_name) {
    var xhr = new XMLHttpRequest();
    // bucket_name = urlParams.get("clb-collab-id")
    bucket_name = "deepslice"
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
            if (jobs[i].jobID == items[1].children[m].key  && jobs[i].status == 'Done') {  
              var skip = true
            }
          }
          if (skip == false) {
            if (jobs[i].status == 'Done') {
              items = AddToItems(setItems, items, jobs[i].brainID,jobs[i].jobID, "Prepared Brains")
              
            }
            else {
            items = AddToItems(setItems, items, jobs[i].brainID,jobs[i].jobID, "Processing")
            }
          }
          
        }
        
      }
    };
  }
  export default JobProcessor;