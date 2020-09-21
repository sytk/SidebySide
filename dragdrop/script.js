window.onload = () => {
  console.log("window on load");

  const video = document.querySelector("#camera");
  const canvas = document.querySelector("#picture");

  document.getElementById('file-sample').addEventListener('change', function (e) {
    // 1枚だけ表示する
    let file = e.target.files[0];
    // ファイルのブラウザ上でのURLを取得する
    let blobUrl = window.URL.createObjectURL(file);
    // img要素に表示
    let img = document.getElementById('picture');
    img.src = blobUrl;
    console.log("img update");
  });

  // document.getElementById('loadFile').addEventListener('change', loadLocalFile);

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
}

let ratio = 0.75;

interact('.resize-drag')
  .resizable({
    // resize from all edges and corners
    edges: { left: true, right: true, bottom: true, top: true },

    listeners: {
      move(event) {
        let target = event.target
        let x = (parseFloat(target.getAttribute('data-x')) || 0)
        let y = (parseFloat(target.getAttribute('data-y')) || 0)

        // update the element's style
        // target.style.width = event.rect.width + 'px'
        // target.style.height = event.rect.height + 'px'

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

function dragMoveListener(event) {
  let target = event.target
  // keep the dragged position in the data-x/data-y attributes
  let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

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

let currentMaterialIndex = 0;
let pdfDocs = [];
  // __PAGE_RENDERING_IN_PROGRESS = 0;

function showPDF(pdfUrl) {
  // $("#pdf-loader").show();
  currentMaterialIndex = document.getElementsByClassName('resize-drag').length;
  let canvas = document.createElement("canvas");
  canvas.classList.add('resize-drag');
  canvas.setAttribute('width', 400);
  canvas.dataset.materialIndex = currentMaterialIndex;

  PDFJS.getDocument({ url: pdfUrl }).then(function (pdfDoc) {
    // __PDF_DOC = pdf_doc;
    pdfDocs.push(pdfDoc);
    let numPages = pdfDoc.numPages;
    canvas.dataset.numPages = numPages;

    // Hide the pdf loader and show pdf container in HTML
    // $("#pdf-loader").hide();
    // $("#pdf-contents").show();
    // $("#pdf-total-pages").text(__NUM_PAGES);

    // Show the first page
    canvas.dataset.page = 1;
    document.body.appendChild(canvas);
    showPage(1);
    document.getElementById('pdf-hide').removeAttribute('disabled');
    document.getElementById('pdf-show').removeAttribute('disabled');
  }).catch(function (error) {
    // If error re-show the upload button
    $("#pdf-loader").hide();
    $("#upload-button").show();

    alert(error.message);
  });
}

function showPage(pageNo) {
  let canvas = document.getElementsByClassName('resize-drag')[currentMaterialIndex],
    canvasCtx = canvas.getContext('2d');

  // __PAGE_RENDERING_IN_PROGRESS = 1;
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

  // While page is being rendered hide the canvas and show a loading message
  $("#pdf-canvas").hide();
  $("#page-loader").show();
  $("#download-image").hide();

  // Update current page in HTML
  $("#pdf-current-page").text(pageNo);

  // Fetch the page
  // __PDF_DOC.getPage(page_no).then(function (page) {
    pdfDocs[currentMaterialIndex].getPage(pageNo).then(function (page) {
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
    page.render(renderContext).then(function () {
      // __PAGE_RENDERING_IN_PROGRESS = 0;

      // Show the canvas and hide the page loader
      $("#pdf-canvas").show();
      $("#page-loader").hide();
      $("#download-image").show();
    });
  });
}

// Upon click this should should trigger click on the #file-to-upload file input element
// This is better than showing the not-good-looking file input element
$("#upload-button").on('click', function () {
  $("#file-to-upload").trigger('click');
});

// When user chooses a PDF file
$("#file-to-upload").on('change', function () {
  // Validate whether PDF
  if (['application/pdf'].indexOf($("#file-to-upload").get(0).files[0].type) == -1) {
    alert('Error : Not a PDF');
    return;
  }

  // $("#upload-button").hide();

  // Send the object url of the pdf
  showPDF(URL.createObjectURL($("#file-to-upload").get(0).files[0]));
});

// Previous page of the PDFï￥
$("#pdf-prev").on('click', function () {
  let material = document.getElementsByClassName('resize-drag')[currentMaterialIndex],
    currentPage = parseInt(material.dataset.page);
  if (currentPage !== 1) {
    showPage(--currentPage);
  }
});

// Next page of the PDF
$("#pdf-next").on('click', function () {
  let material = document.getElementsByClassName('resize-drag')[currentMaterialIndex],
    currentPage = parseInt(material.dataset.page),
    numPages = parseInt(material.dataset.numPages);
  if (currentPage !== numPages) {
    showPage(++currentPage);
  }
});

// Hide the PDF
$("#pdf-hide").on('click', function () {
  $("#pdf-canvas").hide();
});

// Show the PDF
$("#pdf-show").on('click', function () {
  $("#pdf-canvas").show();
});

// Download button
// $("#download-image").on('click', function() {
//     $(this).attr('href', __CANVAS.toDataURL()).attr('download', 'page.png');
// });
