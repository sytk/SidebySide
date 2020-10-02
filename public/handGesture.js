// import('https://unpkg.com/@tensorflow/tfjs@2.1.0');
// import('https://unpkg.com/@tensorflow/tfjs-core@2.1.0/dist/tf-core.js');
// import('https://unpkg.com/@tensorflow/tfjs-converter@2.1.0/dist/tf-converter.js');
// import('https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.1.0/dist/tf-backend-webgl.js');
// //importScripts('http://127.0.0.1:8887/public/handpose.js');

//import * as handpose from 'http://127.0.0.1:8887/public/handpose.js';
var mask_canvas;
var videocanvas;
self.addEventListener('message', ({ data }) => {
// onmessageイベントハンドラーでメインスレッドからのメッセージを受け取る
//onmessage = (event) => {
  importScripts('http://127.0.0.1:8887/public/handpose.js');
  importScripts('https://unpkg.com/@tensorflow/tfjs@2.1.0');
  importScripts('https://unpkg.com/@tensorflow/tfjs-core@2.1.0/dist/tf-core.js');
  importScripts('https://unpkg.com/@tensorflow/tfjs-converter@2.1.0/dist/tf-converter.js');
  importScripts('https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.1.0/dist/tf-backend-webgl.js');
  // メインスレッドからOffscreenCanvasを受け取る
  //mask_canvas = event.data.canvas;
  console.log("handGesutre.js");
  console.log(data);
  console.log(data.videocanvas);
  // if (data.type === 'frame'){
  //   console.log("found frame");
  //   videocanvas = data.imageData;
  //   if (videocanvas != undefined){
  //     console.log(data.imageData);
  //     videocanvs = data.imageData;
  //     //var canvas = data.canvas;
  //     //var ctx = canvas.getContext('2d');
  //   //canvas.width = imagedata.width;
  //   //canvas.height = imagedata.height;
  //     HG()
  //   }
  // }
  //offscreenCanvas = data;
  //console.log(offscreenCanvas.canvas);
  // 以降、offscreenCanvasは通常のCanvasと同様に処理ができる
  
//};
});

async function HG() {
  // Load the MediaPipe handpose model assets.
  console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  let hand_keypoints = new Array(21);
  let raw_hand_keypoints = new Array(21);
  for(let i = 0; i < 21; i++) {
    hand_keypoints[i] = new Array(2).fill(0);
    raw_hand_keypoints[i] = new Array(2).fill(0);
  }

  const landmark_model = await handpose.load();
  const gesture_model = await tf.loadLayersModel('./model/model.json');

  //const video = document.getElementById('camera');
  // var videocanvas;
  // function outputVideo2(){
  //   var video = document.getElementById("camera");
    
  //   setInterval(function(){
  //     videocanvas = document.getElementById("videocanvas");
  //     videocanvas.getContext("2d").drawImage(video, 0, 0, 480, 270);
  //   }, 1000/30);
  //   //console.log(videocanvas.height);
  // }

  // var video = document.getElementById("camera");
  // var videowidth = video.videoWidth ;
	// var videoheight = video.videoHeight ;
  // var videocanvas = document.getElementById("videocanvas");
  // videocanvas.width = videowidth;
  // videocanvas.height = videoheight;
  // canvasCtx = videocanvas.getContext('2d');
  // outputVideo2();
  // function outputVideo2() {
  //   canvasCtx.drawImage(video, 0, 0);
  //   requestAnimationFrame(outputVideo2);
  // };
  
  console.log(videocanvas.height);
  console.log(videocanvas.width);
  //const mask_canvas = document.getElementById('mask');
  const mask_ctx = mask_canvas.getContext('2d');

  //const fps_canvas = document.getElementById('fps');
  //const fps_ctx = fps_canvas.getContext('2d');

  // fps_ctx.font = '20pt Arial';
  mask_canvas.width = video.videoWidth;
  mask_canvas.height = video.videoHeight;

  handTracking();

  async function handTracking() {

    mask_ctx.fillStyle = "rgb(0, 0, 255)";

    const start = performance.now();
    console.log(videocanvas);
    const predictions = await landmark_model.estimateHands(videocanvas);

    mask_ctx.clearRect(0, 0, mask_canvas.width, mask_canvas.height);
    // fps_ctx.clearRect(0, 0, fps_canvas.width, fps_canvas.height);

    if (predictions.length > 0) {
      for (let i = 0; i < predictions.length; i++) {
        const keypoints = predictions[i].landmarks;
        const raw_keypoints = predictions[i].rawLandmarks;
        if (raw_keypoints[17][0] > raw_keypoints[5][0])
          break;
        for (let i = 0; i < keypoints.length; i++) {
          const [x, y, z] = keypoints[i];
          const [raw_x, raw_y, raw_z] = raw_keypoints[i];
          hand_keypoints[i][0] = x;
          hand_keypoints[i][1] = y;
          raw_hand_keypoints[i][0] = raw_x;
          raw_hand_keypoints[i][1] = raw_y;
        }
      }
    }

    calcParmPos();
    calcDepth(hand_keypoints[5], hand_keypoints[17]);

    drawHand();
    // const fps = 1000 / (performance.now() - start);
    // fps_ctx.fillText("fps:" + fps.toFixed(1), 20, 50);
    // fps_ctx.fillText("Gesture:" + gesture, 20, 80);
    // fps_ctx.fillText(parm_depth, 20, 110);

    let data = new Float32Array(42);
    data = raw_hand_keypoints.reduce((pre, current) => { pre.push(...current); return pre }, []);
    let inputs = tf.tensor(data).reshape([1, 42]); // テンソルに変換
    let outputs = gesture_model.predict(inputs);
    let predict = await outputs.data();
    prevGesture = gesture;
    gesture = maxIndex(predict);

    if(gesture == 1)
      gesture = 0;

    requestAnimationFrame(handTracking);
    executeGestureAction();
  }

  function maxIndex(a) {
    let index = 0
    let value = -Infinity
    for (let i = 0, l = a.length; i < l; i++) {
      if (value < a[i]) {
        value = a[i]
        index = i
      }
    }
    return index
  };
  const img = new Image();
  img.src="./src/hand.png";

  function drawHand()
  {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [5, 6], [6, 7], [7, 8],
      [9, 10], [10, 11], [11, 12],
      [13, 14], [14, 15], [15, 16],
      [17, 18], [18, 19], [19, 20],
      [0, 5], [5, 9], [9, 13], [13, 17], [0, 17]
    ]
    if (mask_canvas.getContext) {
      // for(let i = 0; i < hand_keypoints.length; i++)
      // {
      //   const [x,y] = hand_keypoints[i];
      //   mask_ctx.fillRect(x-5, y-5, 10,10);
      // }
      // mask_ctx.fillStyle = "rgb(255,0,0)";
      // mask_ctx.fillRect(parm_pos[0], parm_pos[1], 10,10);
      // mask_ctx.beginPath() ;
      // mask_ctx.arc(parm_pos[0], parm_pos[1], 50, 0, Math.PI * 2, true);
      //
      // for(let i = 0; i < connections.length; i++)
      // {
      //   const s = connections[i][0]
      //   const t = connections[i][1]
      //   mask_ctx.moveTo( hand_keypoints[s][0],hand_keypoints[s][1]) ;
      //   mask_ctx.lineTo( hand_keypoints[t][0],hand_keypoints[t][1]) ;
      // }
      // mask_ctx.strokeStyle = "rgb(0,255,0)";
      // mask_ctx.lineWidth = 3 ;
      // mask_ctx.stroke() ;

      // mask_ctx.fillText(gesture, parm_pos[0], parm_pos[1]);
      mask_ctx.beginPath() ;
      mask_ctx.arc(parm_pos[0], parm_pos[1], 50, 0, Math.PI * 2, true);
      mask_ctx.stroke() ;

      // mask_ctx.drawImage(img, parm_pos[0] - 50, parm_pos[1]- 50, 100, 100);  // ★ここを変更★

    }
  }
  let prev_parm_depth = 0;
  function calcDepth(a,b)
  {
    if(a.length != b.length)
      return null;
    let val = 0;
    for(let i = 0; i < 2; i++)
    {
      val += Math.pow(b[i] - a[i], 2);
    }
    let k = 0.7;
    let LPF = (1-k) * val + k * prev_parm_depth;
    prev_parm_depth = LPF;
    // return Math.sqrt(val);
    parm_depth = LPF;
  }
  let prev_parm_pos = new Array(2).fill(0);
  function calcParmPos()
  {
    let val = new Array(2).fill(0);
    for(let i = 0; i < 2; i++)
      val[i] = (hand_keypoints[0][i] + hand_keypoints[5][i] + hand_keypoints[17][i]) / 3;

    let k = 0.7;
    let LPF = new Array(2);
    for(let i = 0; i < 2; i++)
    {
      LPF[i] = (1-k) * val[i] + k * prev_parm_pos[i];
      parm_pos[i] = prev_parm_pos[i] = LPF[i];
    }
  }

}

/*
`predictions` is an array of objects describing each detected hand, for example:
[
  {
    handInViewConfidence: 1, // The probability of a hand being present.
    boundingBox: { // The bounding box surrounding the hand.
      topLeft: [162.91, -17.42],
      bottomRight: [548.56, 368.23],
    },
    landmarks: [ // The 3D coordinates of each hand landmark.
      [472.52, 298.59, 0.00],
      [412.80, 315.64, -6.18],
      ...
    ],
    annotations: { // Semantic groupings of the `landmarks` coordinates.
      thumb: [
        [412.80, 315.64, -6.18]
        [350.02, 298.38, -7.14],
        ...
      ],
      ...
    }
  }
]
*/

// #        8   12  16  20
// #        |   |   |   |
// #        7   11  15  19
// #    4   |   |   |   |
// #    |   6   10  14  18
// #    3   |   |   |   |
// #    |   5---9---13--17
// #    2    \         /
// #     \    \       /
// #      1    \     /
// #       \    \   /
// #        ------0-
