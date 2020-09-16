window.onload = () => {
  console.log("window on load");

  const video  = document.querySelector("#camera");
  const canvas = document.querySelector("#picture");


  document.getElementById('file-sample').addEventListener('change', function (e) {
      // 1枚だけ表示する
      var file = e.target.files[0];
      // ファイルのブラウザ上でのURLを取得する
      var blobUrl = window.URL.createObjectURL(file);
      // img要素に表示
      var img = document.getElementById('picture');
      img.src = blobUrl;
      console.log("img update");
  });

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

var __PDF_DOC,
        __CURRENT_PAGE,
        __TOTAL_PAGES,
        __PAGE_RENDERING_IN_PROGRESS = 0,
        __CANVAS = $('#pdf-canvas').get(0),
        __CANVAS_CTX = __CANVAS.getContext('2d');
    
    function showPDF(pdf_url) {
        $("#pdf-loader").show();
    
        PDFJS.getDocument({ url: pdf_url }).then(function(pdf_doc) {
            __PDF_DOC = pdf_doc;
            __TOTAL_PAGES = __PDF_DOC.numPages;
            
            // Hide the pdf loader and show pdf container in HTML
            $("#pdf-loader").hide();
            $("#pdf-contents").show();
            $("#pdf-total-pages").text(__TOTAL_PAGES);
    
            // Show the first page
            showPage(1);
        }).catch(function(error) {
            // If error re-show the upload button
            $("#pdf-loader").hide();
            $("#upload-button").show();
            
            alert(error.message);
        });;
    }
    
    function showPage(page_no) {
        __PAGE_RENDERING_IN_PROGRESS = 1;
        __CURRENT_PAGE = page_no;
    
        // Disable Prev & Next buttons while page is being loaded
        $("#pdf-next, #pdf-prev").attr('disabled', 'disabled');
    
        // While page is being rendered hide the canvas and show a loading message
        $("#pdf-canvas").hide();
        $("#page-loader").show();
        $("#download-image").hide();
    
        // Update current page in HTML
        $("#pdf-current-page").text(page_no);
        
        // Fetch the page
        __PDF_DOC.getPage(page_no).then(function(page) {
            // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
            var scale_required = __CANVAS.width / page.getViewport(1).width;
    
            // Get viewport of the page at required scale
            var viewport = page.getViewport(scale_required);
    
            // Set canvas height
            __CANVAS.height = viewport.height;
    
            var renderContext = {
                canvasContext: __CANVAS_CTX,
                viewport: viewport
            };
            
            // Render the page contents in the canvas
            page.render(renderContext).then(function() {
                __PAGE_RENDERING_IN_PROGRESS = 0;
    
                // Re-enable Prev & Next buttons
                $("#pdf-next, #pdf-prev").removeAttr('disabled');
    
                // Show the canvas and hide the page loader
                $("#pdf-canvas").show();
                $("#page-loader").hide();
                $("#download-image").show();
            });
        });
    }
    
    // Upon click this should should trigger click on the #file-to-upload file input element
    // This is better than showing the not-good-looking file input element
    $("#upload-button").on('click', function() {
        $("#file-to-upload").trigger('click');
    });
    
    // When user chooses a PDF file
    $("#file-to-upload").on('change', function() {
        // Validate whether PDF
        if(['application/pdf'].indexOf($("#file-to-upload").get(0).files[0].type) == -1) {
            alert('Error : Not a PDF');
            return;
        }
    
        $("#upload-button").hide();
    
        // Send the object url of the pdf
        showPDF(URL.createObjectURL($("#file-to-upload").get(0).files[0]));
    });
    
    // Previous page of the PDF
    $("#pdf-prev").on('click', function() {
        if(__CURRENT_PAGE != 1)
            showPage(--__CURRENT_PAGE);
    });
    
    // Next page of the PDF
    $("#pdf-next").on('click', function() {
        if(__CURRENT_PAGE != __TOTAL_PAGES)
            showPage(++__CURRENT_PAGE);
    });
    
    // Download button
    $("#download-image").on('click', function() {
        $(this).attr('href', __CANVAS.toDataURL()).attr('download', 'page.png');
    });

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener
