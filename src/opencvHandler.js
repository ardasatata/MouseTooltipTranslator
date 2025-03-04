window.addEventListener(
  "message",
  function(request) {
    if (request.data.type === "segmentBox") {
      segmentBox(request.data);
    }
  },
  false
);


async function segmentBox(request) {
  var type = "segmentSuccess";
  var bboxList = [];
  var base64 = request.base64Url;
  var ratio=1;

  try {
    var canvas1 = await loadImage(request.base64Url);
    var [canvas2,ratio] = preprocessImage(canvas1);
    bboxList = detectText(canvas2);

    // document.body.appendChild(canvasOut);
    base64 = canvas2.toDataURL();
  } catch (err) {
    console.log(err);
    type = "segmentFail";
  }

  response({
    type,
    mainUrl: request.mainUrl,
    base64Url: base64,
    lang: request.lang,
    bboxList,
    timeId: request.timeId,
    ratio
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    var image = new Image(); //image get

    image.onload = () => {
      var canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext("2d").drawImage(image, 0, 0);
      resolve(canvas);
    };
    image.onerror = reject;
    image.src = url;
  });
}

function response(data) {
  window.parent.postMessage(data, "*");
}

// opencv=========================================

function detectText(canvasIn) {
    // https://github.com/qzane/text-detection
    
  var canvasOut = document.createElement("canvas");
  let src = cv.imread(canvasIn);
  let dst = new cv.Mat();
  var bboxList = [];
  var w = src.cols;
  var h = src.rows;
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let ksize = new cv.Size(10, 10);
  var element = cv.getStructuringElement(cv.MORPH_RECT, ksize);

  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
  cv.Sobel(dst, dst, cv.CV_8U, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
  cv.threshold(dst, dst, 0, 255, cv.THRESH_OTSU | cv.THRESH_BINARY);
  cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, element);
  cv.findContours(
    dst,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_NONE
  );

  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt);
    let angle = Math.abs(cv.minAreaRect(cnt).angle);
    let isRightAngle = [0, 90, 180, 270].some(
      (x) => Math.abs(x - angle) <= 30.0
    );
    if (cnt.rows < 100) {
      continue;
    }
    if (area < 500 || area > (h / 10) * (w / 10)) {
      continue;
    }
    if (!isRightAngle) {
      continue;
    }

    let rect = cv.boundingRect(cnt);
    var left = parseInt(Math.max(rect.x - 10, 0));
    var top = parseInt(Math.max(rect.y - 10, 0));
    var width = parseInt(Math.min(rect.width + 20, w-left));
    var height = parseInt(Math.min(rect.height + 20, h-top));

    var bbox = { left, top, width, height };
    bboxList.push(bbox);

    // let color = new cv.Scalar(
    //     Math.round(Math.random() * 255),
    //     Math.round(Math.random() * 255),
    //     Math.round(Math.random() * 255)
    //   );  
    // let point1 = new cv.Point(left, top);
    // let point2 = new cv.Point(left + width, top + height);
    // cv.rectangle(src, point1, point2, color, 2, cv.LINE_AA, 0);
  }

//   cv.imshow(canvasOut, src);
  return bboxList;
}

function image_resize(src, width, height) {
  var dim;
  var r;
  var w = src.cols;
  var h = src.rows;

  // # if both the width and height are None, then return the
  // # original image
  if (!width && !height) {
    return src;
  }

  // # check to see if the width is None
  if (!width) {
    r = height / h;
    dim = [parseInt(w * r), height];
  } else {
    r = width / w;
    dim = [width, parseInt(h * r)];
  }

  let dsize = new cv.Size(...dim);
  cv.resize(src, src, dsize, 0, 0, cv.INTER_AREA);
  return r;
}

function preprocessImage(canvasIn) {
  var canvasOut = document.createElement("canvas");

  let src = cv.imread(canvasIn);
  let dst = new cv.Mat();

  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  var ratio=image_resize(src, 700);

  cv.imshow(canvasOut, src);
  src.delete();
  dst.delete();

  return [canvasOut, ratio];
}
