let parm_pos = new Array(2);
let gesture;
let hand_keypoints = new Array(21);
for(let i = 0; i < 21; i++) {
  hand_keypoints[i] = new Array(2).fill(0);
}

window.onload = () => {
  const video  = document.querySelector("video");
  const canvas = document.querySelector("#picture");
  const se     = document.querySelector('#se');

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
    //load_model()
  });
};

async function main() {
  // Load the MediaPipe handpose model assets.
  const model = await handpose.load();

  // Pass in a video stream to the model to obtain
  // a prediction from the MediaPipe graph.
  const video = document.querySelector("video");
  const canvas = document.getElementById('mask');
  const ctx = canvas.getContext('2d');

  canvas.width = 1280;
  canvas.height = 720;

  async function handTracking() {
    ctx.fillStyle = "rgb(0, 255, 0)";

    const start = performance.now();
    const predictions = await model.estimateHands(video);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    if(hand_keypoints[16][1] < hand_keypoints[13][1])
      gesture = 5;
    else
      gesture = 0;

    if (canvas.getContext) {
      for(let i = 0; i < hand_keypoints.length; i++)
      {
        const [x,y] = hand_keypoints[i];
        ctx.fillRect(x, y, 10,10);
      }
      ctx.fillStyle = "rgb(255,0, 0)";
      ctx.fillRect(parm_pos[0], parm_pos[1], 10,10);
    }

    console.log(1000 / (performance.now() - start) );
    requestAnimationFrame(handTracking);
  };

  handTracking();
}


// $("#button").on('click', function() {
//     // $("#file-to-upload").trigger('click');
//     setInterval(track, 200);
// });

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
