window.onload = () => {
  track()

  run()
};

async function run(){
  await tf.loadModel('./model/model.json').then(handleModel).catch(handleError);
  function handleModel(model) {
      // 正常に読み込まれた時の処理
      // 必要なら入出力shapeを保存
      height = model.inputs[0].shape[0];
      width = model.inputs[0].shape[1];
      // modelの操作...
  }

  function handleError(error) {
      // エラー処理
  }
      }

async function track()
{
    const model = await handpose.load();
          console.log("done");

    // const predictions = await model.estimateHands(document.querySelector("video"));
    //
    // if (predictions.length > 0) {
    //   for (let icvccvvvvvvvvvvvvvvvvvvvvv = 0; i < predictions.length; i++) {
    //     const keypoints = predictions[i].landmarks;
    //     for (let i = 0; i < keypoints.length; i++) {
    //       const [x, y, z] = keypoints[i];
    //       console.log(x,y,z);
    //     }
    //   }
    // }

  }

$("#button").on('click', function() {
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
