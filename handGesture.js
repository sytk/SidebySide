function HG() {
  const video = document.getElementById('camera');
  var canvas = new OffscreenCanvas(100, 1);

  const worker = new Worker("ML.worker.js");

  let start_time = 0;
  worker.addEventListener("message", (e)=>{
    // console.log(e.data);
    console.log(1000 / (performance.now() - start_time));
    video2canvas();
  });

  video2canvas();

  function video2canvas(){
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
    start_time = performance.now();
    worker.postMessage({type: 'frame', imageData}, [imageData.data.buffer]);
    // requestAnimationFrame(video2canvas);
  };

  function sleep(waitMsec) {
    let startMsec = new Date();
    while (new Date() - startMsec < waitMsec);
  };

};

  // Load the MediaPipe handpose model assets.
  // let hand_keypoints = new Array(21);
  // let raw_hand_keypoints = new Array(21);
  // for(let i = 0; i < 21; i++) {
  //   hand_keypoints[i] = new Array(2).fill(0);
  //   raw_hand_keypoints[i] = new Array(2).fill(0);
  // }


  // const mask_canvas = document.getElementById('mask');
  // const mask_ctx = mask_canvas.getContext('2d');
  // await landmark_model.estimateHands(video);
  // document.getElementById("loading").remove();
  // console.log("complite loading");
  //
  // const fps_canvas = document.getElementById('fps');
  // const fps_ctx = fps_canvas.getContext('2d');
  //
  // fps_ctx.font = '20pt Arial';
  // mask_canvas.width = video.videoWidth;
  // mask_canvas.height = video.videoHeight;
  //
  // handTracking();
  //
  // async function handTracking() {
  //
  //   mask_ctx.fillStyle = "rgb(0, 0, 255)";
  //
  //   const start = performance.now();
  //   mask_ctx.clearRect(0, 0, mask_canvas.width, mask_canvas.height);
  //   fps_ctx.clearRect(0, 0, fps_canvas.width, fps_canvas.height);
  //
  //   let has_hand = false;
  //
  //   const fps = 1000 / (performance.now() - start);
  //   fps_ctx.fillText("fps:" + fps.toFixed(1), 20, 50);
  //   fps_ctx.fillText("Gesture:" + gesture, 20, 80);
  //
  //   let data = new Float32Array(42);
  //   data = raw_hand_keypoints.reduce((pre, current) => { pre.push(...current); return pre }, []);
  //   let inputs = tf.tensor(data).reshape([1, 42]); // テンソルに変換
  //   let outputs = gesture_model.predict(inputs);
  //   let predict = await outputs.data();
  //
  //   updateGesture(maxIndex(predict));
  //
  //   if(gesture == 1)
  //     gesture = 0;
  //
  //   requestAnimationFrame(handTracking);
  //   executeGestureAction();
  //
  // }
  // function drawHand()
  // {
  //   const connections = [
  //     [0, 1], [1, 2], [2, 3], [3, 4],
  //     [5, 6], [6, 7], [7, 8],
  //     [9, 10], [10, 11], [11, 12],
  //     [13, 14], [14, 15], [15, 16],
  //     [17, 18], [18, 19], [19, 20],
  //     [0, 5], [5, 9], [9, 13], [13, 17], [0, 17]
  //   ]
  //   if (mask_canvas.getContext) {
  //     for(let i = 0; i < hand_keypoints.length; i++)
  //     {
  //       const [x,y] = hand_keypoints[i];
  //       mask_ctx.fillRect(x-5, y-5, 10,10);
  //     }
  //     mask_ctx.fillStyle = "rgb(255,0,0)";
  //     mask_ctx.fillRect(parm_pos[0], parm_pos[1], 10,10);
  //     mask_ctx.beginPath() ;
  //
  //     for(let i = 0; i < connections.length; i++)
  //     {
  //       const s = connections[i][0]
  //       const t = connections[i][1]
  //       mask_ctx.moveTo( hand_keypoints[s][0],hand_keypoints[s][1]) ;
  //       mask_ctx.lineTo( hand_keypoints[t][0],hand_keypoints[t][1]) ;
  //     }
  //     mask_ctx.strokeStyle = "rgb(0,255,0)";
  //     mask_ctx.lineWidth = 3 ;
  //     mask_ctx.stroke() ;
  //   }
  // }
//}

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
