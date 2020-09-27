async function HG() {
  // Load the MediaPipe handpose model assets.
  let hand_keypoints = new Array(21);
  let raw_hand_keypoints = new Array(21);
  for(let i = 0; i < 21; i++) {
    hand_keypoints[i] = new Array(2).fill(0);
    raw_hand_keypoints[i] = new Array(2).fill(0);
  }

  const landmark_model = await handpose.load();
  const gesture_model = await tf.loadLayersModel('./model/model.json');

  const video = document.getElementById('camera');
  const canvas = document.getElementById('mask');
  const ctx = canvas.getContext('2d');

  const fps_canvas = document.getElementById('fps');
  const fps_ctx = fps_canvas.getContext('2d');

  fps_ctx.font = '40pt Arial';
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  fps_canvas.width = 240;
  fps_canvas.height = 120;
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
        const raw_keypoints = predictions[i].rawLandmarks;
        for (let i = 0; i < keypoints.length; i++) {
          const [x, y, z] = keypoints[i];
          const[raw_x, raw_y, raw_z] = raw_keypoints[i];
          hand_keypoints[i][0] = x;
          hand_keypoints[i][1] = y;
          raw_hand_keypoints[i][0] = raw_x;
          raw_hand_keypoints[i][1] = raw_y;
        }
      }
    }
    for(let i = 0; i < 2; i++){
      parm_pos[i] = (hand_keypoints[0][i] + hand_keypoints[5][i] + hand_keypoints[17][i]) / 3
    }

    drawHand();
    const fps = 1000 / (performance.now() - start);
    fps_ctx.fillText("fps:"+fps.toFixed(1), 20, 70);
    fps_ctx.fillText("Gesture:"+gesture, 20, 100);

    let data = new Float32Array(42);
    data = raw_hand_keypoints.reduce((pre,current) => {pre.push(...current);return pre},[]);
    let inputs = tf.tensor(data).reshape([1,42]); // テンソルに変換
    let outputs = gesture_model.predict(inputs);
    let predict = await outputs.data();
    gesture =  maxIndex(predict);
    if(gesture==1)
      gesture =0

    requestAnimationFrame(handTracking);

    let ratio = document.documentElement.clientWidth / video.videoWidth;
    let x = document.documentElement.clientWidth - parm_pos[0] * ratio;
    let y = parm_pos[1] * ratio;
    let element = document.elementFromPoint(x, y);

    if(element != null){
      if(element.className === 'resize-drag') {
        if (gesture === 5) {
          element.style.left = x - parseFloat(element.style.width) / 2 + 'px';
          element.style.top = y - parseFloat(element.style.height) / 2 + 'px';
        } else if (gesture === 0) {
          // document.getElementById('pdf-next').click();
        }
      }
    }

  };

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
        ctx.fillRect(x-5, y-5, 10,10);
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
}
