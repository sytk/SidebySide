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
    load_model()
  });
};

var model;
async function load_model()
{
  // Load the MediaPipe handpose model.
   model = await handpose.load();
   await model.estimateHands(document.querySelector("video"));
}

async function track()
{
    // const model = await handpose.load();
    const predictions = await model.estimateHands(document.querySelector("video"));
    console.log("img update");

    var canvas = document.getElementById('mask');
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (canvas.getContext) {

      if (predictions.length > 0) {
        for (let i = 0; i < predictions.length; i++) {
          const keypoints = predictions[i].landmarks;
          for (let i = 0; i < keypoints.length; i++) {
            const [x, y, z] = keypoints[i];
            ctx.fillRect(x/4, y/4, 10/4,10/4);
            console.log(x,y);
          }
          console.log(keypoints[i][0]);
        }
      }

    }
  }

$("#button").on('click', function() {
    // $("#file-to-upload").trigger('click');
    setInterval(track, 200);
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
