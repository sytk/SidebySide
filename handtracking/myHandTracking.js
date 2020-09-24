let parm_pos = new Array(2);
let gesture;
let hand_keypoints = new Array(21);
for(let i = 0; i < 21; i++) {
  hand_keypoints[i] = new Array(2).fill(0);
}

window.onload = () => {
  const video  = document.querySelector("video");

  /** カメラ設定 */
  const constraints = {
    audio: false,
    video: {
      width: 1280,
      height: 720,
      facingMode: "user"   // フロントカメラを利用する
      // facingMode: { exact: "environment" }  // リアカメラを利用する場合
    }
  };
  /**
   * カメラを<video>と同期
   */
  navigator.mediaDevices.getUserMedia(constraints)
  .then( (stream) => {
    video.srcObject = stream;
    video.onloadedmetadata = (e) => {
      video.play();
    };
  })
  .catch( (err) => {
    console.log(err.name + ": " + err.message);
  });

  video.addEventListener('loadeddata', (event) => {
    console.log('ready');
    main();
  });
};

async function main() {
  // Load the MediaPipe handpose model assets.
  const landmark_model = await handpose.load();
  const gesture_model = await tf.loadLayersModel('./model/model.json');

  const video = document.querySelector("video");
  const canvas = document.getElementById('mask');
  const ctx = canvas.getContext('2d');

  const fps_canvas = document.getElementById('fps');
  const fps_ctx = fps_canvas.getContext('2d');

  fps_ctx.font = '20pt Arial';
  canvas.width = 1280;
  canvas.height = 720;
  handTracking();

  async function handTracking() {
    ctx.fillStyle = "rgb(0, 0, 255)";

    const start = performance.now();
    const predictions = await landmark_model.estimateHands(video);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fps_ctx.clearRect(0, 0, fps_canvas.width, fps_canvas.height);

    if (predictions.length > 0) {
      for (let i = 0; i < predictions.length; i++) {
        const keypoints = predictions[i].landmarks;
        for (let i = 0; i < keypoints.length; i++) {
          const [x, y, z] = keypoints[i];
          hand_keypoints[i][0] = x;
          hand_keypoints[i][1] = y;
        }
      }
    }
    for(let i = 0; i < 2; i++){
      parm_pos[i] = (hand_keypoints[0][i] + hand_keypoints[5][i] + hand_keypoints[17][i]) / 3
    }

    drawHand()
    if(hand_keypoints[16][1] < hand_keypoints[13][1])
      gesture = 5;
    else
      gesture = 0;

    const fps = 1000 / (performance.now() - start);
    fps_ctx.fillText(fps, 20, 70);

    let data = new Float32Array(42);
    data = hand_keypoints.reduce((pre,current) => {pre.push(...current);return pre},[]);

    let inputs = tf.tensor(data).reshape([1,42]); // テンソルに変換
    let outputs = gesture_model.predict(inputs);
    console.log(await outputs.data())

    // console.log(outputs.data())
    //
    // outputs.data().then(handleData).catch(handleError);
    // function handleData(data) { // Float32Arrayを受け取る
    //   console.log(data)
    // }
    // function handleError(error){
    //   console.log(error)
    // }

    requestAnimationFrame(handTracking);
  };
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
    if (canvas.getContext) {
      for(let i = 0; i < hand_keypoints.length; i++)
      {
        const [x,y] = hand_keypoints[i];
        ctx.fillRect(x, y, 10,10);
      }
      ctx.fillStyle = "rgb(255,0,0)";
      ctx.fillRect(parm_pos[0], parm_pos[1], 10,10);

      ctx.beginPath() ;
      for(let i = 0; i < connections.length; i++)
      {
        const s = connections[i][0]
        const t = connections[i][1]
        ctx.moveTo( hand_keypoints[s][0],hand_keypoints[s][1]) ;
        ctx.lineTo( hand_keypoints[t][0],hand_keypoints[t][1]) ;
      }
      ctx.strokeStyle = "rgb(0,255,0)";
      ctx.lineWidth = 3 ;
      ctx.stroke() ;
    }
  }
  $("#button").on('click', function() {
  });
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
