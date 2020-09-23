let landmark_model = null;
let gesture_model = null;
let parm_pos = new Array(2);
let gesture;
let hand_keypoints = new Array(21);
for(let i = 0; i < 21; i++) {
  hand_keypoints[i] = new Array(2).fill(0);
}

window.onload = () => {
  const video  = document.querySelector("camera");

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

  // run();

  video.addEventListener('loadeddata', (event) => {
    console.log('ready');
    // load_model();
    setInterval(track, 200);
  });
};

async function run(){
  if(gesture_model == null)
  {
    tf.loadModel('./model/model.json').then(handleModel).catch(handleError);
    function handleModel(model) {
        gesture_model = model
    }
    function handleError(error) {
        console.log(error);
    }
  }

}

async function track()
{
    if(landmark_model == null)
      landmark_model = await handpose.load();
    const predictions = await landmark_model.estimateHands(document.querySelector("video"));

    var canvas = document.getElementById('mask');
    canvas.width = 1280;
    canvas.height = 720;

    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgb(0, 255, 0)";


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
    for(let i = 0; i < 2; i++)
    {
      parm_pos[i] = (hand_keypoints[0][i] + hand_keypoints[5][i] + hand_keypoints[17][i]) / 3
    }


    if (canvas.getContext) {
      for(let i = 0; i < hand_keypoints.length; i++)
      {
        const [x,y] = hand_keypoints[i];
        ctx.fillRect(x, y, 10,10);
      }
      ctx.fillStyle = "rgb(255,0, 0)";
      ctx.fillRect(parm_pos[0], parm_pos[1], 10,10);
    }
    if(hand_keypoints[16][1] < hand_keypoints[13][1])
      gesture = 5;
    else
      gesture = 0;
    console.log(gesture);

}

$("#button").on('click', function()
{
});

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
