importScripts('https://unpkg.com/@tensorflow/tfjs@2.1.0/dist/tf.min.js');
importScripts('https://unpkg.com/@tensorflow/tfjs-core@2.1.0/dist/tf-core.js');
importScripts('https://unpkg.com/@tensorflow/tfjs-converter@2.1.0/dist/tf-converter.js');
importScripts('https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.1.0/dist/tf-backend-webgl.js');
importScripts('./lib/handpose.js');

let init_flag = true;
let landmark_model;
let gesture_model;

// 個々の変数がWORKERで編集される

self.addEventListener('message', ({ data }) =>
{
  if (data.type === 'frame'){
    if (data.imageData != undefined){
      HG(data.imageData);
    }
  }
});

let hand_keypoints = new Array(21);
let raw_hand_keypoints = new Array(21);
for(let i = 0; i < 21; i++) {
  hand_keypoints[i] = new Array(2).fill(0);
  raw_hand_keypoints[i] = new Array(2).fill(0);
}

async function HG(canvas) {
  if(init_flag)
  {
    landmark_model = await handpose.load();
    gesture_model = await tf.loadLayersModel('./model/model.json');
    init_flag = false;
  }

  handTracking(canvas);
  async function handTracking(canvas) {
    const predictions = await landmark_model.estimateHands(canvas);
    let has_hand = false;
    if (predictions.length > 0) {
      for (let i = 0; i < predictions.length; i++) {
        const keypoints = predictions[i].landmarks;
        const raw_keypoints = predictions[i].rawLandmarks;
        if (raw_keypoints[17][0] < raw_keypoints[5][0])
        {
          for (let i = 0; i < keypoints.length; i++) {
            const [x, y, z] = keypoints[i];
            const [raw_x, raw_y, raw_z] = raw_keypoints[i];
            hand_keypoints[i][0] = x;
            hand_keypoints[i][1] = y;
            raw_hand_keypoints[i][0] = raw_x;
            raw_hand_keypoints[i][1] = raw_y;
          }
          has_hand = true;
          break;
        }
      }
    }

    let data = new Float32Array(42);
    data = raw_hand_keypoints.reduce((pre, current) => { pre.push(...current); return pre }, []);
    let inputs = tf.tensor(data).reshape([1, 42]); // テンソルに変換
    let outputs = gesture_model.predict(inputs);
    let predict = await outputs.data();
    predict = maxIndex(predict);

    if(has_hand)
    {
      self.postMessage(
      {gesture_predict:predict, hand_keypoints:hand_keypoints, raw_hand_keypoints:raw_hand_keypoints});
    }
    else
    {
      self.postMessage(
      {gesture_predict:undefined, hand_keypoints:undefined, raw_hand_keypoints:undefined});
    }
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
