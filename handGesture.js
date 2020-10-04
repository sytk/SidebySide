function HG() {
  const worker = new Worker("ML.worker.js");
  var canvas = new OffscreenCanvas(100, 1);
  const mask_canvas = document.getElementById('mask');
  const mask_ctx = mask_canvas.getContext('2d');
  const fps_canvas = document.getElementById('fps');
  const fps_ctx = fps_canvas.getContext('2d');
  let start_time = 0;
  let hand_keypoints;
  let raw_hand_keypoints;
  let fps = 0;

  fps_ctx.font = '20pt Arial';
  mask_canvas.width = video.videoWidth;
  mask_canvas.height = video.videoHeight;

  worker.addEventListener("message", (e)=>{
    // sleep(100);

    load_icon = document.getElementById("loading");
    if(load_icon != null)
      load_icon.remove();

    console.log("HG");
    hand_keypoints = e.data.hand_keypoints;
    raw_hand_keypoints = e.data.raw_hand_keypoints;
    let predict = e.data.gesture_predict;

    fps = 1000 / (performance.now() - start_time);

    mask_ctx.clearRect(0, 0, mask_canvas.width, mask_canvas.height);
    fps_ctx.clearRect(0, 0, fps_canvas.width, fps_canvas.height);

    updateGesture(predict);
    updateDepth();
    updateParmPos();

    fps_ctx.fillText("fps:" + fps.toFixed(1), 20, 50);
    fps_ctx.fillText("Gesture:" + gesture, 20, 80);
    drawHand();
    executeGestureAction();
    throwJob();
  });

  throwJob();

  function throwJob(){
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
  }
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
    mask_ctx.fillStyle = "rgb(0,0,255)";
    if (mask_canvas.getContext && hand_keypoints != undefined) {
      for(let i = 0; i < hand_keypoints.length; i++)
      {
        const [x,y] = hand_keypoints[i];
        mask_ctx.fillRect(x-5, y-5, 10,10);
      }
      mask_ctx.fillStyle = "rgb(255,0,0)";
      mask_ctx.fillRect(parm_pos[0], parm_pos[1], 10,10);
      mask_ctx.beginPath() ;

      for(let i = 0; i < connections.length; i++)
      {
        const s = connections[i][0]
        const t = connections[i][1]
        mask_ctx.moveTo( hand_keypoints[s][0],hand_keypoints[s][1]) ;
        mask_ctx.lineTo( hand_keypoints[t][0],hand_keypoints[t][1]) ;
      }
      mask_ctx.strokeStyle = "rgb(0,255,0)";
      mask_ctx.lineWidth = 3 ;
      mask_ctx.stroke() ;
    }
  };

  let prev_parm_depth = 0;
  function updateDepth()
  {
    if(hand_keypoints == undefined)
      return;

    let a = hand_keypoints[5];
    let b = hand_keypoints[17];
    let val = 0;
    for(let i = 0; i < 2; i++)
      val += Math.pow(b[i] - a[i], 2);

    let k = 0.9 *fps/30;
    if(k > 0.9)
      k = 0.9;
    console.log(k);

    let LPF = (1-k) * val + k * prev_parm_depth;
    prev_parm_depth = LPF;
    parm_depth = LPF;
  };

  let prev_parm_pos = new Array(2).fill(0);
  function updateParmPos()
  {
    if(hand_keypoints == undefined)
    {
      parm_pos = new Array(2).fill(undefined);
      return;
    }

    let val = new Array(2).fill(0);
    for(let i = 0; i < 2; i++)
      val[i] = (hand_keypoints[0][i] + hand_keypoints[5][i] + hand_keypoints[17][i]) / 3;

    let k = 0.7*fps/30;
    let LPF = new Array(2);
    for(let i = 0; i < 2; i++)
    {
      LPF[i] = (1-k) * val[i] + k * prev_parm_pos[i];
      parm_pos[i] = prev_parm_pos[i] = LPF[i];
    }
  };

  let start= 0;
  let prev_predict = 0;
  function updateGesture(predict)
  {
    if(predict == 1)
      predict = 0;
    if(prev_predict != predict)
      start = performance.now();
    if(performance.now() - start > 100)
      gesture = predict;
    prev_predict = predict
  }
};

  // Load the MediaPipe handpose model assets.


  // const mask_canvas = document.getElementById('mask');
  // const mask_ctx = mask_canvas.getContext('2d');
  // await landmark_model.estimateHands(video);
  // document.getElementById("loading").remove();
  // console.log("complite loading");

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
  //   updateGesture(maxIndex(predict));
  // }
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
