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
var prevEmotion = 'neutral';
var currEmotion = 'neutral';
var lastText = '';

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
  .then(listenToGetInfo)
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

function listenToGetInfo(){
  $(document).focus();
  $(document).keydown(function(e) {
    // console.log(e.keyCode);
    if (e.ctrlKey  &&  e.altKey  &&  e.keyCode === 67) {
      sceneDescription();
    }
    if (e.ctrlKey  &&  e.altKey  &&  e.keyCode === 69) {
      sceneCaptureEmotion();
    }
    if (e.ctrlKey  &&  e.altKey  &&  e.keyCode === 80) {
      replaySpeech();
    }
  });
}

function sceneDescription(){
  speechEmotion('Analyse de la scène.');
  record('description');
}

function sceneCaptureEmotion(){
  speechEmotion('Analyse des émotions.');
  record('emotion');
}

function replaySpeech(){
  if(lastText !== ''){
    speechEmotion(lastText);
  } else {
    speechEmotion('Vous n\'avez pas encore analysé la scène ou les émotions de votre ou vos interlocuteurs.');
  }

}

function record(type) {
  // console.log('reccord');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  var base64 = canvas.toDataURL('image/jpeg', 0.5); // PNG is the default
  // console.log(base64);

  if(type === "description"){
    processImage(base64);
  } else if(type === "emotion"){
    getMSEmotion(base64);
  }

}

function processImage(img) {
  // console.log(img);
  // **********************************************
  // *** Update or verify the following values. ***
  // **********************************************

  // Replace the subscriptionKey string value with your valid subscription key.
  var subscriptionKey = "76db4e7eceb54799a39fb0788f55b9ed";

  // Replace or verify the region.
  //
  // You must use the same region in your REST API call as you used to obtain your subscription keys.
  // For example, if you obtained your subscription keys from the westus region, replace
  // "westcentralus" in the URI below with "westus".
  //
  // NOTE: Free trial subscription keys are generated in the westcentralus region, so if you are using
  // a free trial subscription key, you should not need to change this region.
  var uriBase = "https://westeurope.api.cognitive.microsoft.com/vision/v1.0/analyze";

  // Request parameters.
  // var params = {
  //     "visualFeatures": "Categories,Description,Color",
  //     "details": "",
  //     "language": "en",
  // };

  var params = {
      // Request parameters
      "maxCandidates": "1",
  };

  var params = {
      // Request parameters
      "visualFeatures": "Categories,Description,Faces",
      "language": "en",
  };

  $.ajax({
      url: "https://westeurope.api.cognitive.microsoft.com/vision/v1.0/analyze?" + $.param(params),
      beforeSend: function(xhrObj){
          // Request headers
          xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
      },
      type: "POST",
      processData: false,
      contentType: 'application/octet-stream',
      // Request body
      data: makeblob(img),
      timeout: 10000
  })
  .done(function(data) {
      // console.log(data.description.captions[0].text, data.description.captions[0].confidence);

      var highestScoreDesc = 0;
      var description = "";
      data.description.captions.forEach(function(cap){
        if(highestScoreDesc < cap.confidence){
          highestScoreDesc = cap.confidence;
          description = cap.text;
        }
      });
      if(highestScoreDesc <= 0.6){
        translateUSToFrench('It could be a '+description);
      }

      if(highestScoreDesc > 0.6 && highestScoreDesc <= 0.76){
        translateUSToFrench('It is certainly a '+description);
      }

      if(highestScoreDesc > 0.76){
        translateUSToFrench('It is a '+description);
      }

      data.faces.forEach(function(face){
        // console.log(face.age, face.gender, face.faceRectangle);
        faceTrack(face, face.gender+" "+face.age+" years");
      });


  })
  .fail(function(error) {
      console.log(error);
  })
  .always(function(){
      // setTimeout(record(), 500);
  });
}

function getMSEmotion(img){
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
      data: makeblob(img),
      timeout: 10000
  })
  .done(function(data) {
      // console.log(data[0].scores);
      var highestScore = 0;
      var text = "";
      var emotion = "";
      if(data[0] !== undefined){
        $.each(data, function(key, val){
          $.each(data[key].scores, function(key, value){
            if(highestScore < value){
              highestScore = value;
              emotion = key;
            }
          });
          var i = key+1;
          if(data[0].faceRectangle !== undefined){
            // console.log('on call', data[key].faceRectangle);
            // console.log(prevEmotion, currEmotion);
            // if(prevEmotion !== currEmotion){
              // console.log(prevEmotion, currEmotion);
              // prevEmotion = currEmotion;
              text = text + "L'interlocuteur "+ i +" a l'air "+ getFrenchEmotion(emotion);
              faceTrack(data, getFrenchEmotion(emotion), highestScore);
              lastText = text;
              speechEmotion(text);
            // }
          }
        });

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

function getFrenchEmotion(enEmotion){
  switch(enEmotion){
    case 'happiness' :
      return'joyeux';
      break;
    case 'anger' :
      return 'en colère';
      break;
    case 'sadness' :
      return 'triste';
      break;
    case 'comptempt' :
      return 'méprisant';
      break;
    case 'disgust' :
      return 'dégouté';
      break;
    case 'surprise' :
      return 'surpris';
      break;
    case 'fear' :
      return 'appeuré';
      break;
    case 'neutral' :
      return 'neutre';
      break;
  }
}

function translateUSToFrench(text){

  $.ajax({
    url : "TranslateMethod.php",
    type: "POST",
    data: {text:text},
    timeout: 10000
  }).done(function(data) {
      $('.detected-emotion').find('p').text(data);
      lastText = data;
      speechEmotion(data);
  })
  .fail(function(error) {
      console.log(error);
  })
  .always(function(){
      // setTimeout(record(), 500);
  });
}

function speechEmotion(text){
  var msg = new SpeechSynthesisUtterance();
  // var voices = window.speechSynthesis.getVoices();
  // msg.voice = voices[10]; // Note: some voices don't support altering params
  // msg.voiceURI = 'native';
  // msg.volume = 1; // 0 to 1
  // msg.rate = 1; // 0.1 to 10
  // msg.pitch = 2; //0 to 2
  msg.text = text;
  msg.lang = 'fr-FR';

  msg.onend = function(e) {
    console.log('Finished in ' + event.elapsedTime + ' seconds.');
  };

  speechSynthesis.speak(msg);
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

  if(datas !== undefined && Array.isArray(datas)){
    // console.log(x_scale, y_scale);
    for (var i = 0; i < datas.length; i++) {
      // console.log(datas[i].faceRectangle);
      var x = (datas[i].faceRectangle.left * x_scale + x_scale);
      var y = (datas[i].faceRectangle.top * y_scale + y_offset);
      var width = datas[i].faceRectangle.width * x_scale;
      var height = (datas[i].faceRectangle.height * y_scale);
      console.log(x, y, width, height);


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
  } else {
    var x = (datas.faceRectangle.left * x_scale + x_scale);
    var y = (datas.faceRectangle.top * y_scale + y_offset);
    var width = datas.faceRectangle.width * x_scale;
    var height = (datas.faceRectangle.height * y_scale);


    ctx3.font = "10pt Calibri,Geneva,Arial";
    ctx3.fillStyle = "rgb(0,0,0)";
    ctx3.fillText(emotion, x+2, y-5);

    ctx2.beginPath();
    ctx2.lineWidth="1";
      ctx2.strokeStyle="rgb(255,0,0)";
      ctx2.fillStyle="rgb(255,0,0)";

    ctx2.strokeRect(x, y, width, height);
    ctx2.fillRect(x, y-15, 95, 15);
    ctx2.stroke();
  }
}
