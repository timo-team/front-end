/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

from : https://simpl.info/getusermedia/sources/
*/

'use strict';

var videoElement = document.querySelector('video');
var videoSelect = document.querySelector('select#videoSource');
var canvas = document.querySelector('canvas#videoCanvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;
var myInterval = null;

navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(getStream).catch(handleError);

videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'camera ' +
        (videoSelect.length + 1);
      videoSelect.appendChild(option);
    } else {
      console.log('Found one other kind of source/device: ', deviceInfo);
    }
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  var constraints = {
    audio: /*{
      deviceId: {exact: audioSelect.value}
    }*/ false,
    video: {
      width : $('section').width(),//320;//video.clientWidth;
      height : ($('section').width()*9)/16,
      deviceId: {exact: videoSelect.value},
      options: {mirror:true}
    }
  };
  navigator.mediaDevices
  .getUserMedia(constraints)
  .then(gotStream)
  .then(record)
  .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.style.opacity = 1;
  videoElement.srcObject = stream;
  localMediaStream = window.stream;

}

function handleError(error) {
  console.log('Error: ', error);
}

function closeVideo(){
  let stream = videoElement.srcObject;
  let tracks = stream.getTracks();
  tracks.forEach(function(track) {
    track.stop();
  });
  stream.stop;

  videoElement.srcObject = null;
  clearInterval(myInterval);
  $('video').hide();
}

function record() {
  // console.log('reccord');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  var base64 = canvas.toDataURL('image/jpeg', 0.5); // PNG is the default
  // console.log(base64);

  var params = {
      // Request parameters
      "outputStyle": "aggregate",
  };

  $.ajax({
      url: "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize?" + $.param(params),
      beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","740579c771b94498877f87d1855831df");
      },
      type: "POST",
      processData: false,
      contentType: 'application/octet-stream',
      // Request body
      data: makeblob(base64),
      timeout: 10000
  })
  .done(function(data) {
      // console.log(data[0].scores);
      var emotion = null;
      var highestScore = 0;
      var text = "";
      if(data[0] !== undefined){
        $.each(data, function(key, val){
          $.each(data[key].scores, function(key, value){
            if(highestScore < value){
              highestScore = value;
              emotion = key;
            }
          });
          var i = key+1;
          text = text + " person "+ i +" seems "+emotion;
        });
        if(data[0].faceRectangle !== undefined){
          // console.log('on call', data[key].faceRectangle);
          faceTrack(data, emotion, highestScore);
        }
        $('.detected-emotion').find('p').text(text);
      }
  })
  .fail(function(error) {
      console.log(error);
  })
  .always(function(){
      setTimeout(record(), 500);
  });
}

function makeblob (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}


function faceTrack(datas, emotion, rate) {
  if(datas !== undefined){
    var c = document.getElementById("rectCanvas");
    var cText = document.getElementById("rectTextCanvas");
    c.width = cText.width = videoElement.clientWidth;
    c.height = cText.height = videoElement.clientHeight;
    c.style.top = cText.style.top = videoElement.offsetTop;
    c.style.left = cText.style.left = videoElement.offsetLeft
    var ctx2 = c.getContext("2d");
    var ctx3 = cText.getContext("2d");

    var x_offset = 0, y_offset = 0, x_scale = 1, y_scale = 1;
    if (videoElement.clientWidth * videoElement.videoHeight > videoElement.videoWidth * videoElement.clientHeight) {
      x_offset = (videoElement.clientWidth - videoElement.clientHeight *
                  videoElement.videoWidth / videoElement.videoHeight) / 2;
    } else {
      y_offset = (videoElement.clientHeight - videoElement.clientWidth *
                  videoElement.videoHeight / videoElement.videoWidth) / 2;
    }
    x_scale = (videoElement.clientWidth - x_offset * 2) / videoElement.videoWidth;
    y_scale = (videoElement.clientHeight - y_offset * 2) / videoElement.videoHeight;
// console.log(x_scale, y_scale);
    for (var i = 0; i < datas.length; i++) {
      // console.log(datas[i].faceRectangle);
      var x = (datas[i].faceRectangle.left * x_scale + x_scale);
      var y = (datas[i].faceRectangle.top * y_scale + y_offset);
      var width = datas[i].faceRectangle.width * x_scale;
      var height = (datas[i].faceRectangle.height * y_scale);
// console.log(x, y, width, height);


      ctx3.font = "10pt Calibri,Geneva,Arial";
      // ctx3.strokeStyle = "rgb(0,0,0)";
      ctx3.fillStyle = "rgb(0,0,0)";
      // ctx3.strokeText(emotion, x, y-5);
      ctx3.fillText(emotion, x+2, y-5);

      ctx2.beginPath();
      ctx2.lineWidth="1";
      if(rate < 0.33){
        ctx2.strokeStyle="rgb(255,0,0)";
        ctx2.fillStyle="rgb(255,0,0)";
      }else if(rate > 0.33 && rate < 0.66){
        ctx2.strokeStyle="rgb(255,255,0)";
        ctx2.fillStyle="rgb(255,255,0)";
      }else if(rate > 0.66){
        ctx2.strokeStyle="rgb(0,255,0)";
        ctx2.fillStyle="rgb(0,255,0)";
      }

      ctx2.strokeRect(x, y, width, height);
      ctx2.fillRect(x, y-15, 80, 15);
      ctx2.stroke();

    }
  }
}
