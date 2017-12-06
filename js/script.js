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
// var audioSelect = document.querySelector('select#audioSource');
var videoSelect = document.querySelector('select#videoSource');
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;
var myInterval = null;

navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(getStream).catch(handleError);

// audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    /*if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label ||
        'microphone ' + (audioSelect.length + 1);
      audioSelect.appendChild(option);
    } else */if (deviceInfo.kind === 'videoinput') {
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
  .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;
  // videoElement.src = window.URL.createObjectURL(window.stream);
  localMediaStream = window.stream;

  myInterval = setInterval(function(){
    record();
  }, 100);
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
  var base64 = canvas.toDataURL(); // PNG is the default
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
  })
  .done(function(data) {
      // console.log(data[0].scores);
      var emotion = null;
      var highestScore = 0;
      var text = "";
      if(data[0].scores !== undefined){
        console.log(data);
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
        $('.detected-emotion').find('p').text(text);
      }

  })
  .fail(function(error) {
      console.log(error);
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

/*var videoElement = document.querySelector('video');
// var audioSelect = document.querySelector('select#audioSource');
var videoSelect = document.querySelector('select#videoSource');
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var localMediaStream = null;

navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(getStream).catch(handleError);

// audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  if(deviceInfos > 1){
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
  } else {
    $(videoSelect).hide();
    console.log(deviceInfos[0]);
    videoSelect.value = deviceInfos[0].deviceId;
  }
}

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  var constraints = {
    audio: false,
    video: {
      deviceId: {exact: videoSelect.value}
    }
  };

  navigator.mediaDevices.getUserMedia(constraints).
    then(gotStream).catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console
  videoElement.srcObject = stream;

  video.width = $('section').width();//320;//video.clientWidth;
  video.height = ($('section').width()*9)/16;//240;// video.clientHeight;
  // Canvas is 1/2 for performance. Otherwise, getImageData() readback is
  // awful 100ms+ as 640x480.
  record();
}

function handleError(error) {
  console.log('Error: ', error);
}



function closeVideo(){
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
    $('video').hide();
    // window.location.href = "./thankyou.html";
}

function record() {
  if (localMediaStream) {
      ctx.drawImage(video, 0, 0);
      // "image/webp" works in Chrome.
      // Other browsers will fall back to image/png.
      console.log(canvas.toDataURL('image/webp'));
    }

    var apiUrl = '';

    // $.ajax({
    //   url: apiUrl,
    //   dataType: 'json',
    //   data: base64dataUrl,
    //   type: 'POST',
    //   success: function(data) {
    //     console.log(data);
    //     }
    //   });
    // });


  // rafId = requestAnimationFrame(drawVideoFrame_);
}
*/
