//jsdom ver 19
const jsdom = require("jsdom");
const fs = require("fs");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const url = "http://169.254.1.190/awp/IOtest.html";

const datenows = new Date();
let month = datenows.getMonth() + 1;
let year = datenows.getFullYear();
month < 10 ? (month = "0" + month) : "";

const filePath = "Report_" + month + year + ".csv";
//console.log(filePath);
let arr = [];
let arrforCsv = [];
let status = 0;
let stsbf, runtime, rawruntime, stoptime, avgspd, stscreatebf;

const httpGet = (theUrl) => {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", theUrl, true); // false for synchronous request
  xmlHttp.send(null);
  // return xmlHttp.responseText;
};
const extractTime = (str) => {
  dates = str.slice(4, 14);
  times = str.slice(15, 23);
  return { dates, times };
};

const strtoUnix = (str) => {
  let dates = extractTime(str).dates;
  let times = extractTime(str).times;
  let timCon = dates + " " + times;
  let raws = new Date(timCon).getTime() / 1000; //raw in milisec
  return raws;
};
const addZero = (num) => {
  if (num < 10) {
    num = "0" + num;
  }
  return num;
};
const rawtohhmmss = (int) => {
  let zSecond = int % 60;
  let zMinute = ((int - zSecond) / 60) % 60;
  let zHour = (int - zMinute * 60 - zSecond) / 3600;
  return addZero(zHour) + ":" + addZero(zMinute) + ":" + addZero(zSecond);
};

setInterval(function () {
  //write data
  if (stsbf === 0) {
    httpGet("http://169.254.1.190/awp/IOtest.html?%22DB_Report%22.PCstatus=1");
    stsbf = 1;
  } else {
    httpGet("http://169.254.1.190/awp/IOtest.html?%22DB_Report%22.PCstatus=0");
    stsbf = 0;
  }

  //read data
  jsdom.JSDOM.fromURL(url).then(function (dom) {
    //if status change
    status = dom.window.document.getElementById("status").textContent;
    if (status !== stscreatebf) {
      // receive data
      for (let index = 0; index < 8; index++) {
        arr[index] = dom.window.document.getElementById(index).textContent;
      }
      rawruntime = strtoUnix(arr[5]) - strtoUnix(arr[4]);

      runtime = rawtohhmmss(rawruntime);
      stoptime = rawtohhmmss(strtoUnix(arr[4]) - strtoUnix(arr[6]));
      avgspd = Math.round(arr[3] / (rawruntime / 60));
      //console.log(arr[3]);
      //console.log(avgspd);

      arrforCsv[0] = extractTime(arr[0]).dates; //date
      arrforCsv[1] = extractTime(arr[0]).times; //times
      arrforCsv[2] = arr[1]; //SO_Name
      arrforCsv[3] = arr[2]; //Turunan
      arrforCsv[4] = arr[3]; //Length
      arrforCsv[5] = runtime; //runtime
      arrforCsv[6] = stoptime; //Load/Unload
      arrforCsv[7] = avgspd; //avgspd

      //check receive data
      if (arrforCsv.length === 8) {
        //check exist file
        fs.access(filePath, (error) => {
          if (!error) {
            // The check succeeded
            stscreatebf = status;
            try {
              fs.appendFile(filePath, arrforCsv + "\r\n", (err) => {
                if (err) console.error("Could not append data to csv");
                console.log("Data successfully appended");
              });
            } catch (error) {
              console.log(error);
            }
          } else {
            // The check failed
            stscreatebf = status;
            try {
              fs.createWriteStream(filePath);
              fs.appendFile(filePath, arrforCsv + "\r\n", (err) => {
                if (err) console.error("Could not append data to csv");
                console.log("Data successfully appended");
              });
            } catch (error) {
              console.log(error);
            }
          }
        });
      } else {
        console.log("data empty");
      }
    } else {
      console.log("No Action");
    }
  });
}, 1000);
