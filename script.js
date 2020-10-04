let parm_pos = new Array(2);
let parm_depth;
let baseDepth;
let gesture;
let prevGesture;

const video = document.getElementById("camera");
let currentMaterialIndex = 0;
let materials = [];
let fileNames = [];

window.onload = () => {
  console.log("window on load");
  document.getElementById('fps').style.visibility = 'hidden';
  document.getElementById('mask').style.visibility = 'hidden';
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
    .then((stream) => {
      video.srcObject = stream;
      video.onloadedmetadata = (e) => {
        video.play();
      };
    })
    .catch((err) => {
      console.log(err.name + ": " + err.message);
    });

  video.addEventListener('loadeddata', (event) => {
    console.log('ready');
    // HG();
  });
};

// モーダルウィンドウ表示
function modalBlock() { document.getElementById('modal').style.display = 'block'; }
// モーダルウィンドウ非表示
function modalNone() { document.getElementById('modal').style.display = 'none'; }

//drop zoneの実装
function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  document.getElementById('drop_text').style.display = "none";
  document.getElementById('pdf-loader').style.display = "block";

  files = evt.dataTransfer.files; // FileList object.

  // 以下に必要なFile Objectのプロパティを記述
  var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    if (/^image\/(png|jpeg|gif)$/.test(f.type)) {
      var fr = new FileReader();
      showIMGthumbnail(fr, f);
      // ファイル読み込み
      fr.readAsDataURL(f);
      showImage(URL.createObjectURL(f));
    } else if (f.type == 'application/pdf') {
      fileNames.push(f.name);
      showPDF(URL.createObjectURL(f));
    }
  }
  document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
  document.getElementById('start-show').style.display = "block";
}

document.addEventListener('keydown', downKey);
function downKey(e) {
  switch(e.code) {
    case 'KeyF':
      goFullScreen();
      break;
    case 'ArrowRight':
      nextPage();
      break;
    case 'ArrowLeft':
      previousPage();
      break;
    case 'KeyH':
      hidePDF();
      break;
    case 'Backspace':
      deletePDF();
      break;
    default:
      break;
  }
}

document.getElementById('start-show').addEventListener("click", ()=>{ goFullScreen(); });
// フルスクリーンを実装
function goFullScreen() {
  const element = document.getElementById('fullscreen');
  screenfull.request(element).then(function () { console.log('Browser entered fullscreen mode'); })
}
// フルスクリーンを解除
function exitFullScreen() { screenfull.exit(); }


function showIMGthumbnail(fr, file) {
  var img = document.createElement('img');
  var canvas = createThumbnailCanvas();
  let canvasCtx = canvas.getContext('2d');
  fr.tmpImg = img;
  fr.onload = function () {
    this.tmpImg.src = this.result;
    this.tmpImg.onload = function () {
      document.getElementById('pdf-loader').style.display = "none";
      canvasCtx.drawImage(this, 0, 0, canvas.width, canvas.height);
      drawFileName(canvasCtx, file.name);
    }
  }
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
}

// イベントリスナーを設定
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);

interact('.resize-drag')
  .resizable({
    // resize from all edges and corners
    edges: { left: true, right: true, bottom: true, top: true },

    listeners: {
      move(event) {
        let target = event.target
        let x = target.getBoundingClientRect().left + window.pageXOffset;
        let y = target.getBoundingClientRect().top + window.pageYOffset;
        replaceZindex(target);
        // update the element's style
        let ratio;
        if (target.hasAttribute('data-ratio')) {
          ratio = target.dataset.ratio;
        } else {
          ratio = target.height / target.width;
          target.dataset.ratio = ratio;
        }
        if (Math.abs(event.deltaRect.left) < Math.abs(event.deltaRect.top)) {
          target.style.width = event.rect.height / ratio + 'px'
          target.style.height = event.rect.height + 'px'
        }
        else {
          target.style.width = event.rect.width + 'px'
          target.style.height = event.rect.width * ratio + 'px'
        }

        x += event.deltaRect.left
        y += event.deltaRect.top

        // target.dataset.scale = parseFloat(target.style.height) / target.height;
        target.style.left = x + 'px';
        target.style.top = y + 'px'
        target.dataset.scale = parseFloat(target.style.width) / target.width;
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
  .on('tap', function (event) {
    replaceZindex(event.target);
  })
function dragMoveListener(event) {
  let target = event.target
  replaceZindex(target);
  // keep the dragged position in the data-x/data-y attributes
  let x = target.getBoundingClientRect().left + window.pageXOffset + event.dx;
  let y = target.getBoundingClientRect().top + window.pageYOffset + event.dy;
  target.style.left = x + 'px';
  target.style.top = y + 'px';
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener

function showPDF(pdfUrl) {
  currentMaterialIndex = document.getElementsByClassName('resize-drag').length;
  let canvas = document.createElement("canvas");
  canvas.classList.add('resize-drag');
  canvas.dataset.materialIndex = currentMaterialIndex;
  canvas.width = 1000
  canvas.style.zIndex = currentMaterialIndex+10;
  document.getElementById('material-area').appendChild(canvas);

  PDFJS.getDocument({ url: pdfUrl }).then(function (pdfDoc) {
    materials.push(pdfDoc);
    let numPages = pdfDoc.numPages;
    canvas.dataset.numPages = numPages;
    // Show the first page
    canvas.dataset.page = 1;
    showPage(1);
    document.getElementById('pdf-hide').removeAttribute('disabled');
    document.getElementById('pdf-delete').removeAttribute('disabled');
    showPDFthumbnail(); // ここにおかないとダメっぽい
  }).catch(function (error) {
    // If error re-show the upload button
    document.getElementById('upload-button').show();
    alert(error.message);
  });

  interval = 200;
  canvas.org_top = canvas.style.top = currentMaterialIndex*interval + 'px';
  canvas.org_left = canvas.style.left =  0 + 'px';

  canvas.style.width = 300 + 'px';
  canvas.dataset.scale = parseFloat(canvas.style.width) / canvas.width;
  canvas.onclick = () => updateCurrentMaterialIndex(canvas);
}

async function showPage(pageNo) {
  let canvas = document.getElementsByClassName('resize-drag')[currentMaterialIndex],
    canvasCtx = canvas.getContext('2d');

    canvas.dataset.page = pageNo;

  // Disable Prev & Next buttons while page is being loaded
  if (canvas.dataset.page === '1') {
    document.getElementById('pdf-prev').setAttribute('disabled', true);
  } else {
    document.getElementById('pdf-prev').removeAttribute('disabled');
  }
  if (canvas.dataset.page === canvas.dataset.numPages) {
    document.getElementById('pdf-next').setAttribute('disabled', true);
  } else {
    document.getElementById('pdf-next').removeAttribute('disabled');
  }

    materials[currentMaterialIndex].getPage(pageNo).then(function (page) {
    // As the canvas is of a fixed width we need to set the scale of the viewport accordingly

    let scaleRequired = canvas.width / page.getViewport(1).width;

    // Get viewport of the page at required scale
    let viewport = page.getViewport(scaleRequired);

    // Set canvas height
    canvas.height = viewport.height;

    let renderContext = {
      canvasContext: canvasCtx,
      viewport: viewport
    };

    // Render the page contents in the canvas
    page.render(renderContext);

  });
}

function showImage(imgUrl) {
  const canvas = document.createElement("canvas");
  canvas.classList.add('resize-drag');
  currentMaterialIndex = document.getElementsByClassName('resize-drag').length;
  canvas.dataset.materialIndex = currentMaterialIndex;
  canvas.width = 1000
  canvas.style.zIndex = currentMaterialIndex+10;
  document.getElementById('material-area').appendChild(canvas);
  canvas.style.width = 300 + 'px';

  interval = 200;
  canvas.org_top = canvas.style.top = currentMaterialIndex*interval + 'px';
  canvas.org_left = canvas.style.left =  0 + 'px';
  canvas.dataset.scale = parseFloat(canvas.style.width) / canvas.width;

  const canvasCtx = canvas.getContext('2d');
  const img = new Image();
  img.src = imgUrl;
  img.onload = () => {
    canvas.height = img.height = img.height * (canvas.width / img.width);
    canvasCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  materials.push(img);

  canvas.dataset.page = 1;
  canvas.dataset.numPages = 1;
  // document.body.appendChild(canvas);
  document.getElementById('pdf-hide').removeAttribute('disabled');
  document.getElementById('pdf-delete').removeAttribute('disabled');

  canvas.onclick = () => updateCurrentMaterialIndex(canvas);
}

function updateCurrentMaterialIndex(canvas) {
  let currentCanvas = document.getElementsByClassName('resize-drag')[currentMaterialIndex];
  if (typeof canvas !== 'undefined' && typeof currentCanvas !== 'undefined') {
    currentCanvas.removeAttribute('id');
    currentMaterialIndex = canvas.dataset.materialIndex;
    canvas.setAttribute('id', 'selected');
  }
}

function showPDFthumbnail () {
  let canvas = createThumbnailCanvas();
  let canvasCtx = canvas.getContext('2d');

  materials[currentMaterialIndex].getPage(1).then(function (page) {
    // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
    let scaleRequired = canvas.width / page.getViewport(1).width;

    // Get viewport of the page at required scale
    let viewport = page.getViewport(scaleRequired);

    let renderContext = {
      canvasContext: canvasCtx,
      viewport: viewport
    };

    document.getElementById('pdf-loader').style.display = "none";
    // Render the page contents in the canvas
    page.render(renderContext).then(function () {
      drawFileName(canvasCtx, fileNames[currentMaterialIndex]);
    });
  });
}

function createThumbnailCanvas() {
  let canvas = document.createElement("canvas");
  canvas.classList.add('thumbnail');
  canvas.setAttribute('width', 100);
  canvas.setAttribute('height', 100);
  document.getElementById('drop_zone').appendChild(canvas);
  return canvas;
}

function drawFileName(canvasCtx, fileName) {
  canvasCtx.fillStyle = "white";        // 塗りつぶす色
  canvasCtx.fillRect(0, 75, 100, 25);    // 描画
  // ファイル名描画
  canvasCtx.fillStyle = "black";
  canvasCtx.font = "10px 'ＭＳ ゴシック'";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  canvasCtx.fillText(fileName, 50, 87, 95);
}

function replaceZindex(element)
{
  let materials = document.getElementsByClassName('resize-drag');
  for(let i = 0; i < materials.length; i++)
    if(materials[i].style.zIndex > element.style.zIndex)
    {
      materials[i].style.zIndex--;
    }
  element.style.zIndex = materials.length+10;
}
function executeGestureAction() {
  let ratio = document.documentElement.clientWidth / video.videoWidth;
  let x = document.documentElement.clientWidth - parm_pos[0] * ratio;
  let y = parm_pos[1] * ratio;
  if(isNaN(x) || isNaN(y))
    x = y = -1;
  let element = document.elementFromPoint(x, y);
  if (element != null) {
    if (element.className === 'resize-drag') {
      replaceZindex(element);
      updateCurrentMaterialIndex(element);
      element.setAttribute('id', 'grabbing');

      if (gesture === 2 && prevGesture !== 2) {
        document.getElementById('pdf-prev').click();
      } else if (gesture === 3 && prevGesture !== 3) {
        document.getElementById('pdf-next').click();
      } else if (gesture === 5) {
        let scale = element.dataset.scale;
        if (prevGesture !== 5) {
          baseDepth = parm_depth / scale;
        }
        scale = parm_depth / baseDepth;
        element.dataset.scale = scale;
        element.style.width = element.width * scale + 'px'
        element.style.height = element.height * scale + 'px'

        element.textContent = Math.round(element.style.width) + '\u00D7' + Math.round(element.style.height)
        element.style.left = x - parseFloat(element.style.width) / 2 + 'px';
        element.style.top = y - parseFloat(element.style.height) / 2 + 'px';
      } else if (gesture === 7) {
          document.getElementById('pdf-hide').click();
      } else if (gesture === 0) {}
      updateCurrentMaterialIndex(element);
      element.setAttribute('id', 'grabbing');
    } else {
      updateCurrentMaterialIndex(document.getElementsByClassName('resize-drag')[currentMaterialIndex]);
    }
  }
  prevGesture = gesture;
}

// Upon click this should should trigger click on the #file-to-upload file input element
// This is better than showing the not-good-looking file input element
document.getElementById('upload-button').onclick = function () {
  document.getElementById('file-to-upload').click();
}

// When user chooses a PDF file
document.getElementById('file-to-upload').onchange = function () {
  const file = document.getElementById('file-to-upload').files[0];
  console.log(file);
  switch (file.type) {
    case 'application/pdf':
      showPDF(URL.createObjectURL(file));
      break;
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      showImage(URL.createObjectURL(file));
      break;
    default:
      alert('Error : Not a PDF or Image');
      break;
  }
}

// Previous page of the PDF
document.getElementById('pdf-prev').addEventListener("click", ()=>{ previousPage(); });
function previousPage() {
  let material = document.getElementsByClassName('resize-drag')[currentMaterialIndex],
    currentPage = parseInt(material.dataset.page);
  if (currentPage !== 1) {
    showPage(--currentPage);
  }
}

// Next page of the PDF
document.getElementById('pdf-next').addEventListener("click", ()=>{ nextPage(); });
function nextPage() {
  console.log('pdf-next called.');
  let material = document.getElementsByClassName('resize-drag')[currentMaterialIndex],
    currentPage = parseInt(material.dataset.page),
    numPages = parseInt(material.dataset.numPages);
  if (currentPage !== numPages) {
    showPage(++currentPage);
  }
}

// Hide the PDF
document.getElementById('pdf-hide').addEventListener("click", ()=>{ hidePDF(); });
function hidePDF() {
  //document.getElementById('pdf-canvas').hide();
  // document.getElementsByClassName('resize-drag')[currentMaterialIndex].style.visibility = "hidden";
  let canvas =  document.getElementsByClassName('resize-drag')[currentMaterialIndex];
  canvas.style.width = 300 + 'px';
  canvas.style.height = 300 * canvas.height / canvas.width + 'px';
  canvas.style.top = canvas.org_top;
  canvas.style.left = canvas.org_left;
}

// Delete the PDF
document.getElementById('pdf-delete').addEventListener("click", ()=>{ deletePDF(); });
function deletePDF() {
  let canvases = document.getElementsByClassName('resize-drag');
  canvases[currentMaterialIndex].remove()
  materials.splice(currentMaterialIndex, 1);
  for (let i = 0; i < canvases.length; i++) {
    canvases[i].dataset.materialIndex = i;
  }
  currentMaterialIndex = 0;
}

document.getElementById('HG-details').addEventListener("click", ()=>{ switchHGdisplay(); });
function switchHGdisplay() {
  if(document.getElementById('mask').style.visibility == 'hidden')
    document.getElementById('mask').style.visibility = 'visible';
  else
    document.getElementById('mask').style.visibility = 'hidden';
  if(document.getElementById('fps').style.visibility == 'hidden')
    document.getElementById('fps').style.visibility = 'visible';
  else
    document.getElementById('fps').style.visibility = 'hidden';
}
