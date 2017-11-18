
(function(exports) {

exports.URL = exports.URL || exports.webkitURL;

exports.requestAnimationFrame = exports.requestAnimationFrame ||
    exports.webkitRequestAnimationFrame || exports.mozRequestAnimationFrame ||
    exports.msRequestAnimationFrame || exports.oRequestAnimationFrame;

exports.cancelAnimationFrame = exports.cancelAnimationFrame ||
    exports.webkitCancelAnimationFrame || exports.mozCancelAnimationFrame ||
    exports.msCancelAnimationFrame || exports.oCancelAnimationFrame;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;

var ORIGINAL_DOC_TITLE = document.title;
var video = $('video');
var canvas = document.createElement('canvas'); // offscreen canvas.
var rafId = null;
var startTime = null;
var endTime = null;
var frames = [];

function turnOnCamera() {
  video.controls = false;

  var finishVideoSetup_ = function() {
    // Note: video.onloadedmetadata doesn't fire in Chrome when using getUserMedia so
    // we have to use setTimeout. See crbug.com/110938.
    setTimeout(function() {
      video.width = /*320;*/video.clientWidth;
      video.height = /*240;*/ video.clientHeight;
      // Canvas is 1/2 for performance. Otherwise, getImageData() readback is
      // awful 100ms+ as 640x480.
      console.log(video.width, video.height);
      canvas.width = video.width;
      canvas.height = video.height;
      // record();

      // setTimeout(stop, 100);
    }, 1000);
  };

  navigator.getUserMedia({video: true, audio: true}, function(stream) {
    video.src = window.URL.createObjectURL(stream);
    finishVideoSetup_();
  }, function(e) {
    alert('Fine, you get a movie instead of your beautiful face ;)');
    video.src = 'Chrome_ImF.mp4';
    finishVideoSetup_();
  });
};

function record() {
  var ctx = canvas.getContext('2d');
  var CANVAS_HEIGHT = canvas.height;
  var CANVAS_WIDTH = canvas.width;

  // frames = []; // clear existing frames;
  // startTime = Date.now();

  function drawVideoFrame_(time) {
    rafId = requestAnimationFrame(drawVideoFrame_);
    ctx.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Read back canvas as webp.
    //console.time('canvas.dataURL() took');
    // var url = canvas.toDataURL('image/jpeg', 1); // image/jpeg is way faster :(
    //console.timeEnd('canvas.dataURL() took');
    // frames.push(url);

    // UInt8ClampedArray (for Worker).
    //frames.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data);

    // ImageData
    //frames.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));

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
};

function stop() {
  cancelAnimationFrame(rafId);
  endTime = Date.now();

  console.log('frames captured: ' + frames.length + ' => ' +
              ((endTime - startTime) / 1000) + 's video');

  embedVideoPreview();
};

function embedVideoPreview(opt_url) {
  var url = opt_url || null;

  // https://github.com/antimatter15/whammy
  // var encoder = new Whammy.Video(1000/60);
  // frames.forEach(function(dataURL, i) {
  //   encoder.add(dataURL);
  // });
  // var webmBlob = encoder.compile();

  // if (!url) {
    var webmBlob = Whammy.fromImageArray(frames, 1000 / 60);
    url = window.URL.createObjectURL(webmBlob);
  // }

  video.src = url;
  // downloadLink.href = url;

  console.log(url);
}

turnOnCamera();

exports.$ = $;

})(window);
