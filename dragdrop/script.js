// function previewFile(file) {
//   // プレビュー画像を追加する要素
//   // const preview = document.getElementById('preview');
//   const canvas = document.querySelector("#picture");
//
//   // FileReaderオブジェクトを作成
//   const reader = new FileReader();
//
//   // ファイルが読み込まれたときに実行する
//   reader.onload = function (e) {
//     const imageUrl = e.target.result; // 画像のURLはevent.target.resultで呼び出せる
//     const img = document.createElement("img"); // img要素を作成
//     const ctx = canvas.getContext("2d");
//     img.src = imageUrl; // 画像のURLをimg要素にセット
//     //preview.appendChild(img); // #previewの中に追加
//     img.onload = function(){
//       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//     }
//   }
//
//   // いざファイルを読み込む
//   reader.readAsDataURL(file);
// }
//
//
// // <input>でファイルが選択されたときの処理
// const fileInput = document.getElementById('example');
// const handleFileSelect = () => {
//   const files = fileInput.files;
//   for (let i = 0; i < files.length; i++) {
//     previewFile(files[i]);
//   }
// }
// if (fileInput) {
//   fileInput.addEventListener('change', handleFileSelect);
// }



window.onload = () => {
  const video  = document.querySelector("#camera");
  const canvas = document.querySelector("#picture");

  var img = new Image();


  document.getElementById('file-sample').addEventListener('change', function (e) {
      // 1枚だけ表示する
      var file = e.target.files[0];

      // ファイルのブラウザ上でのURLを取得する
      var blobUrl = window.URL.createObjectURL(file);

      // img要素に表示
      img = document.getElementById('picture');
      img.src = blobUrl;
      // const ctx = canvas.getContext("2d");
      //var img = new Image();
      // img.src = "../dog.jpeg";

      // ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log("hello world!");
  });

  console.log("hello world!");

  // const ctx = canvas.getContext("2d");
  //var img = new Image();
  // img.src = "../dog.jpeg";

  // img.onload = function(){
  //   ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  // }


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

  /**
  * シャッターボタン
  */
  document.querySelector("#shutter").addEventListener("click", () => {

  // 演出的な目的で一度映像を止めてSEを再生する
  video.pause();  // 映像を停止
  setTimeout( () => {
    video.play();    // 0.5秒後にカメラ再開
  }, 500);
  });

}

interact('.resize-drag')
  .resizable({
    // resize from all edges and corners
    edges: { left: true, right: true, bottom: true, top: true },

    listeners: {
      move (event) {
        var target = event.target
        var x = (parseFloat(target.getAttribute('data-x')) || 0)
        var y = (parseFloat(target.getAttribute('data-y')) || 0)

        // update the element's style
        target.style.width = event.rect.width + 'px'
        target.style.height = event.rect.height + 'px'

        // translate when resizing from top or left edges
        x += event.deltaRect.left
        y += event.deltaRect.top

        target.style.webkitTransform = target.style.transform =
          'translate(' + x + 'px,' + y + 'px)'

        target.setAttribute('data-x', x)
        target.setAttribute('data-y', y)
        target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
      }
    },
    modifiers: [
      // keep the edges inside the parent
      interact.modifiers.restrictEdges({
        outer: 'parent'
      }),

      // minimum size
      interact.modifiers.restrictSize({
        min: { width: 100, height: 50 }
      })
    ],

    inertia: true
  })
  .draggable({
    listeners: { move: window.dragMoveListener },
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ]
  })

function dragMoveListener (event) {
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

  // translate the element
  target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)'

  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener
