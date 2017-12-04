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

navigator.mediaDevices.enumerateDevices()
  .then(gotDevices).then(getStream).catch(handleError);

audioSelect.onchange = getStream;
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
    audio: {
      deviceId: {exact: audioSelect.value}
    },
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
  canvas.width = video.width;
  canvas.height = video.height;

        record();
}

function handleError(error) {
  console.log('Error: ', error);
}

function record() {
  var ctx = canvas.getContext('2d');
  var CANVAS_HEIGHT = canvas.height;
  var CANVAS_WIDTH = canvas.width;

  frames = []; // clear existing frames;
  startTime = Date.now();

  function drawVideoFrame_(time) {
    rafId = requestAnimationFrame(drawVideoFrame_);

    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    var base64dataUrl = canvas.toDataURL('image/jpeg');
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    var img = new Image();
    img.src = base64dataUrl;

    console.log(img.src);

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
  };

  rafId = requestAnimationFrame(drawVideoFrame_);
}
