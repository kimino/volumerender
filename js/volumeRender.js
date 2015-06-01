//volumeRender.js
var gl;
var currentProgram;
var backProgram;
var finalProgram;
var g_ITick = 0;
var framebuffer;
var renderbuffer;
var backface_buffer;
var front_buffer;
var final_image;
var window_size = 800.0;
var stepsize = 0.0025;
var toggle_visuals = true;
var g_bAutoRotating = false;
var isInit = false;
var isFileLoad = false;
var isDraw = false;
var fieldOfView = -99999.0;
var g_dRadius = -99999.0;
var g_dCenter = -99999.0;
var g_dZoom = -99999.0;
var mouseDown = false;
var touchDown = false;
var lastMouseX = null;
var lastMouseY = null;
var lastTouchX = null;
var lastTouchY = null;
var moonRotationMatrix = new Matrix4();
var xBlock = 0;
var yBlock = 0;
var xTexsize = 0;
var yTexsize = 0;
var zSize = 0;
var sizeInput = false;
var fileBuffer;
var colorBuffer;
var xLen;
var yLen;
var zLen;
var contantColor = new Float32Array(16);
lastTime = 0.0;

function initShaders() {
  backProgram = createProgram("back-fs", "back-vs");
  finalProgram = createProgram("final-fs", "final-vs");
  screenProgram = createProgram("screen-fs", "screen-vs");
}

function createShader(id){
    var shader;// 用来保存着色器的变量
    var scriptElement = document.getElementById(id);// 根据id从HTML中获取指定的script标签
    if(!scriptElement){return;}// 如果指定的script标签不存在，则返回
    switch(scriptElement.type){// 判断script标签的type属性
        case 'x-shader/x-vertex':// 顶点着色器的时候
            shader = gl.createShader(gl.VERTEX_SHADER);
            break;
        case 'x-shader/x-fragment':// 片段着色器的时候
            shader = gl.createShader(gl.FRAGMENT_SHADER);
            break;
        default :
            return;
    }
    gl.shaderSource(shader, scriptElement.text);// 将标签中的代码分配给生成的着色器
    gl.compileShader(shader);// 编译着色器
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){ // 判断一下着色器是否编译成功
        return shader;// 编译成功，则返回着色器
    }else{// 编译失败，弹出错误消息
        alert(gl.getShaderInfoLog(shader));
    }
}

function createProgram(vs1, fs1){
    var vs = createShader(vs1);
    var fs = createShader(fs1);

    var program = gl.createProgram();// 程序对象的生成
    gl.attachShader(program, vs);// 向程序对象里分配着色器
    gl.attachShader(program, fs);
    gl.linkProgram(program); // 将着色器连接
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){// 判断着色器的连接是否成功
        gl.useProgram(program);// 成功的话，将程序对象设置为有效
        return program;// 返回程序对象
    }else{// 如果失败，弹出错误信息
        alert(gl.getProgramInfoLog(program));
    }
}

function drawScene() {
    gl.viewport(0, 0, window_size, window_size);
    currentProgram = backProgram;
    gl.useProgram(currentProgram);
}

function main() {
//获取<canvas>元素
var canvas = document.getElementById('webgl');

//获取webgl上下文
gl = getWebGLContext(canvas);
	if (!gl) {
		alert('Failed to get the rendering context for WebGL');
		return;
	}
	//初始化着色器
	initShaders();
	drawScene();


	//设置<canvas>背景色
	contantColor = [0.0, 0.0, 0.0, 1.0];
	gl.clearColor(contantColor[0], contantColor[1], contantColor[2], contantColor[3]);
	//enable the hidden surface removal function
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  resizeCanvas();

  document.getElementById('file1').addEventListener('change', handleFileSelect1, false);
  document.getElementById('file2').addEventListener('change', handleFileSelect2, false);

  canvas.onmousedown = handleMouseDown;
  canvas.onmouseup = handleMouseUp;
  canvas.onmousemove = handleMouseMove;
  //IE注册事件
  if(document.attachEvent){
  document.attachEvent('onmousewheel',handleMouseWheel);
  }
  //firefox使用addEventListener添加滚轮事件
  else if(document.addEventListener){
  document.addEventListener('DOMMouseScroll',handleMouseWheel,false);
  }
  //chrome，这里不可以加else
  document.onmousewheel = handleMouseWheel;

    canvas.addEventListener('touchstart', handleTouchDown, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchUp, false);


    document.getElementById('slider').addEventListener('onmouseup', changeStepsize, false);

//tick();
}

function resizeCanvas() {
	 var canvas = document.getElementById('webgl');
   window_size = document.body.clientWidth * 800.0 / 1920.0;
   canvas.width = window_size;
   canvas.height = window_size;
   if (isInit && isFileLoad && sizeInput && (!isDraw))
   {
      createBuffer();
      draw();
   }
   else
   {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   }
}

function tick() {
  if (isInit && isFileLoad && sizeInput) {
  if (g_bAutoRotating) {
    g_ITick = 30;
    requestAnimationFrame(tick);//request that the browser calls tick
  }
  else {
    g_ITick = 0;
  }
  if (!isDraw) {
    draw();
  }
  }
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}
function handleMouseUp(event) {
    mouseDown = false;
}
function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }

    var btnNum = event.button;
    var newX = event.clientX;
    var newY = event.clientY;

    var canvas = document.getElementById('webgl');
    var rect = event.target.getBoundingClientRect();
    var w = document.body.clientWidth;
    var h = document.body.clientHeight;
    lastMouseX = ((lastMouseX - rect.left) - canvas.width/2.0)/(canvas.width/2.0);
    lastMouseY = (canvas.height/2.0 - (lastMouseY - rect.top))/(canvas.height/2.0);
    newX = ((newX - rect.left) - canvas.width/2.0)/(canvas.width/2.0);
    newY = (canvas.height/2.0 - (newY - rect.top))/(canvas.height/2.0);

    var pre3d = trans3d(lastMouseX, lastMouseY);
    var new3d = trans3d(newX, newY);

    var square = pre3d[0]*new3d[0]+
        pre3d[1]*new3d[1]+
        pre3d[2]*new3d[2];
    var angle = Math.acos(square)*180.0/(Math.PI);//*180.0/(Math.PI)
    var axis = new Float32Array([1.0,0.0,0.0]);
    axis[0] = pre3d[1]*new3d[2]-pre3d[2]*new3d[1];
    axis[1] = pre3d[2]*new3d[0]-pre3d[0]*new3d[2];
    axis[2] = pre3d[0]*new3d[1]-pre3d[1]*new3d[0];
    var newRotationMatrix = new Matrix4();
    newRotationMatrix.setRotate(angle, axis[2], axis[1], -axis[0]);
    moonRotationMatrix = newRotationMatrix.multiply(moonRotationMatrix);

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    draw();
}
function handleMouseWheel(event) {
  if(event.wheelDelta){//IE/Opera/Chrome
  g_dZoom = g_dZoom + event.wheelDelta * 0.001;
  }else if(event.detail){//Firefox
  g_dZoom = g_dZoom - event.detail * 0.04;
  }

  if (g_dZoom > 1.5) g_dZoom = 1.5;
  if (g_dZoom < 0.2) g_dZoom = 0.2;
  if (!isDraw) {
    draw();
  }
}

function handleTouchDown(event) {
    if (event.targetTouches.length == 1) {
        touchDown = true;
        event.preventDefault();// 阻止浏览器默认事件，重要
        var touch = event.targetTouches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    }
}
function handleTouchUp(event) {
    touchDown = false;
}

function handleTouchMove(event) {
    if (!touchDown) {
        return;
    }

// 如果这个元素的位置内只有一个手指的话
    if (event.targetTouches.length == 1) {
        event.preventDefault();// 阻止浏览器默认事件，重要
        var touch = event.targetTouches[0];

        var newX = touch.clientX;
        var newY = touch.clientY;

        var canvas = document.getElementById('webgl');
        var rect = event.target.getBoundingClientRect();
        var w = document.body.clientWidth;
        var h = document.body.clientHeight;
        lastTouchX = ((lastTouchX - rect.left) - canvas.width / 2.0) / (canvas.width / 2.0);
        lastTouchY = (canvas.height / 2.0 - (lastTouchY - rect.top)) / (canvas.height / 2.0);
        newX = ((newX - rect.left) - canvas.width / 2.0) / (canvas.width / 2.0);
        newY = (canvas.height / 2.0 - (newY - rect.top)) / (canvas.height / 2.0);

        var pre3d = trans3d(lastTouchX, lastTouchY);
        var new3d = trans3d(newX, newY);

        var square = pre3d[0] * new3d[0] +
            pre3d[1] * new3d[1] +
            pre3d[2] * new3d[2];
        var angle = Math.acos(square) * 180.0 / (Math.PI);//*180.0/(Math.PI)
        var axis = new Float32Array([1.0, 0.0, 0.0]);
        axis[0] = pre3d[1] * new3d[2] - pre3d[2] * new3d[1];
        axis[1] = pre3d[2] * new3d[0] - pre3d[0] * new3d[2];
        axis[2] = pre3d[0] * new3d[1] - pre3d[1] * new3d[0];
        var newRotationMatrix = new Matrix4();
        newRotationMatrix.setRotate(angle, axis[2], axis[1], -axis[0]);
        moonRotationMatrix = newRotationMatrix.multiply(moonRotationMatrix);

        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        draw();
    }
}

function trans3d(x, y) {
  var square = x*x+y*y;
  var vec = new Float32Array([x, y, 0.0]);
  if (square<=1.0) {
    // if (x, y) is within the circle of radius 1
    // calculate z so that the modulus of vector is 1
    vec[2] = Math.sqrt( 1.0 - square);
} else {
    // if is out of the circle, do nomarlization
    // this vector is the nearest position on the circle
    // so that z is 0
    var length = Math.sqrt( square);
    vec[0] = x/length;
    vec[1] = y/length;
    vec[2] = 0.0;
}
return vec;
}

function handleFileSelect1(evt) {
if (window.File && window.FileReader && window.FileList && window.Blob) {
    var files = evt.target.files;//FileList object
    var files1;var files2; var files3 = new Array();var fileNum = 0;
// Loop through the FileList
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var reader = new FileReader();
      reader.readAsArrayBuffer(f);
      // Closure to capture the file information.
      reader.onload = function(evt) {
        files1 = evt.target.result;
        fileBuffer = evt.target.result;
        fileNum++;
      };
      reader.onerror = function(evt) {
        alert("file could not be read!");
      };
    }
} else {
  alert('the file apis are not fully supported in this browser.');
}
}

function handleFileSelect2(evt) {
if (window.File && window.FileReader && window.FileList &&
window.Blob) {
    var files = evt.target.files;//FileList object
    var files1;var files2; var files3 = new Array();var fileNum = 0;
// Loop through the FileList
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var reader = new FileReader();
      reader.readAsArrayBuffer(f);
      // Closure to capture the file information.
      reader.onload = function(evt) {
        files2 = evt.target.result;
        colorBuffer = evt.target.result;
      };
      reader.onerror = function(evt) {
        alert("file could not be read!");
      };
    }
} else {
  alert('the file apis are not fully supported in this browser.');
}
}

function checkInput() {
    var xLen = parseInt(document.getElementById("xLen").value);
    var yLen = parseInt(document.getElementById("yLen").value);
    var zLen = parseInt(document.getElementById("zLen").value);
    if (xLen && yLen && zLen && fileBuffer && colorBuffer) {
      sizeInput = true;
      init(fileBuffer, colorBuffer, xLen, yLen, zLen);
      return;
    }
    else
    {
        alert("please input the size of the volume!");
        return;
    }
}

function changeBackground() {
	var color = (document.getElementById("contantColor").value).toString();
  contantColor[0] = parseInt("0x"+(color.substr(1,2)))/255.0;
  contantColor[1] = parseInt("0x"+(color.substr(3,2)))/255.0;
  contantColor[2] = parseInt("0x"+(color.substr(5,2)))/255.0;
	gl.clearColor(contantColor[0], contantColor[1], contantColor[2], contantColor[3]);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (isInit && isFileLoad && sizeInput && (!isDraw)) {
    draw();
  }
}

function backToggle() {
    toggle_visuals = (!toggle_visuals);
    if (isInit && isFileLoad && sizeInput && (!isDraw)) {
    draw();
  }
}


function rotToggle() {
   g_bAutoRotating = !g_bAutoRotating;
   tick();
}

function changeStep() {
	stepsize = parseFloat(document.getElementById("stepSize").value);
	document.getElementById('slider').value = stepsize;
	  if (!isDraw) {
    draw();
  }
}

function changeStepsize(event) {
		stepsize = parseFloat(document.getElementById("slider").value);
		document.getElementById('stepSize').value = stepsize;
	  if (!isDraw) {
    draw();
  }
}

function clamp(a,b,c) {
  var d = ((b) < (a))? (a) : (((b) > (c))? (c): (b));
  return d;
}

function init(fileBuffer, colorBuffer, xLen, yLen, zLen) {
  gl.enable(gl.CULL_FACE);

  create_volumetexture(fileBuffer, xLen, yLen, zLen);
  create_preintegrationTable(colorBuffer);

  createBuffer();

 fieldOfView = 30.0;
 g_dRadius = 0.5*Math.sqrt(12.0);
 g_dCenter = g_dRadius/Math.sin(degree2rad(fieldOfView)/2.0);
 g_dZoom = 1.0;

 draw();
 isInit = true;
 isFileLoad = true;
}

function degree2rad(a) {
  var b = a/57.295;
  return b;
}

function draw() {
  isDraw = true;
  currentProgram = backProgram;
  gl.useProgram(currentProgram);
  //矩阵变换
  var _degree1 = g_ITick/50.0;
  var aspectRatio = window_size/window_size;

  var perspectiveMatrix = resize(window_size, window_size);
  enable_renderbuffers();

  var modelMatrix = new Matrix4();
  modelMatrix.setScale(g_dZoom, g_dZoom, g_dZoom);
  moonRotationMatrix.rotate(_degree1, 0, 1, 0);
  modelMatrix.multiply(moonRotationMatrix);

  var u_ModelViewMatrix = gl.getUniformLocation(currentProgram, 'u_ModelViewMatrix');
	if (!u_ModelViewMatrix) {
        alert('Failed to get the storage location of u_ModelViewMatrix');
	return;
	}
  gl.uniformMatrix4fv(u_ModelViewMatrix, false, modelMatrix.elements);

  //绘制到缓冲区中，不要绘制到窗口上，换着色器
  render_backface();
  raycasting_pass(perspectiveMatrix, modelMatrix);
  //绘制到屏幕
  gl.bindFramebuffer( gl.FRAMEBUFFER,null);
  render_buffer_to_screen();
  isDraw = false;
}

function resize(w, h) {
  dRadius = 0.5*Math.sqrt(w*w+h*h);
  if (h == 0) { h = 1.0; }
  gl.viewport(0, 0, w, h);
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(60.0, w/h, 0.01, 400.0);
  projMatrix.lookAt(3, 3, 1, 0, 0, 0, 0, 1, 0);
  var u_PerspectiveMatrix = gl.getUniformLocation(currentProgram, 'u_PerspectiveMatrix');
	if (!u_PerspectiveMatrix) {
        alert('Failed to get the storage location of u_PerspectiveMatrix');
	return;
	}
  gl.uniformMatrix4fv(u_PerspectiveMatrix, false, projMatrix.elements);

  var modelMatrix = [
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 0,
0, 0, 0, 1
];
//modelMatrix.setRotate(30, 0, 1, 0);
    var u_ModelViewMatrix = gl.getUniformLocation(currentProgram, 'u_ModelViewMatrix');
	if (!u_ModelViewMatrix) {
        alert('Failed to get the storage location of u_ModelViewMatrix');
	return;
	}
  gl.uniformMatrix4fv(u_ModelViewMatrix, false, new Float32Array(modelMatrix));

  return projMatrix;
}

function enable_renderbuffers() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
}

function create_volumetexture(fileBuffer, xLen, yLen, zLen) {
//尝试把标量值也放在纹理表中
  var scalars1 = new Uint8Array(fileBuffer);
  var xNum = Math.round(Math.ceil(Math.sqrt(yLen*zLen/xLen)));
  var yNum = Math.round(Math.ceil(xLen*xNum/yLen));//xLen*xNum/yLen));  zLen/xNum));
  var len = xNum*(xLen+2)*yNum*(yLen+2);
  var buf1 = new ArrayBuffer(len);//3397758
	var scalars = new Uint8Array(buf1);//默认初始化都是0

	xBlock = xNum;
  yBlock = yNum;
  xTexsize = xNum*(xLen+2);
  yTexsize = yNum*(yLen+2);
  zSize = zLen;

  for (var i = 0; i < xTexsize; ++i)
	for (var j = 0; j < yTexsize; ++j)
 {	var x = i % (xLen+2);
	  var y = j % (yLen+2);
	  var z = Math.floor(j/yLen)*14+Math.floor(i/xLen)+1;

	  if (x == 0 && y == 0) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+y*xLen+x];
	}
	else if (x == 0 && y == (yLen+1)) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+(y-2)*xLen+x];
	}
	else if (x == (xLen+1) && y == 0) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+y*xLen+(x-2)];
	}
	else if (x == (xLen+1) && y == (yLen+1)) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+(y-2)*xLen+(x-2)];
	}
	else if (x == (xLen+1)) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+(y-1)*xLen+(x-2)];
	}
	else if (x == 0) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+(y-1)*xLen+x];
	}
	else if (y == (yLen+1)) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+(y-2)*xLen+(x-1)];
	}
	else if (y == 0) {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+y*xLen+(x-1)];
	}
	else {
	  scalars[j*xTexsize+i] = scalars1[z*xLen*yLen+(y-1)*xLen+(x-1)];
	}
}

	var texture0 = gl.createTexture();
  if (!texture0) {
      alert('Failed to create texture0');
			return -1;
	}
	  gl.activeTexture(gl.TEXTURE0);
	  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
	  gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);//1778 1872
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, xTexsize, yTexsize, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, scalars);


}

function create_preintegrationTable(colorBuffer) {
  //颜色映射表
  var colors = new Uint8Array(colorBuffer);
	var texture1 = gl.createTexture();//create a texture object
  if (!texture1) {
      alert('Failed to create texture1');
			return -1;
	}
	  gl.activeTexture(gl.TEXTURE0+1);
	  //gl.pixelStorei(gl.PACK_ALIGNMENT, 4);
	  gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colors);
//尝试绘制预积分表
  var r=0.0,g=0.0,b=0.0,a=0.0;
	var rcol = 0,gcol = 0,bcol = 0,acol = 0;
	var rInt = new Float64Array(new ArrayBuffer(256*8));
	var gInt = new Float64Array(new ArrayBuffer(256*8));
	var bInt = new Float64Array(new ArrayBuffer(256*8));
	var aInt = new Float64Array(new ArrayBuffer(256*8));
	var lookupImg = new Uint8Array(new ArrayBuffer(256*256*4));	//GLubyte lookupImg[256*256*4];
	var smin = 0,smax = 0;
	var factor = 0.0;var tauc = 0.0;
	var lookupindex = 0;
	//compute integral functions
	for (var i1 = 1; i1 < 256; ++i1)
	{
		tauc = ( colors[ ( i1 - 1 ) * 4 + 3 ] + colors[ i1 * 4 + 3 ] ) / 2.0;
		r = r + ( colors[ ( i1 - 1 ) * 4 + 0 ] + colors[ i1 * 4 + 0 ] ) / 2.0 * tauc / 255.0;
		g = g + ( colors[ ( i1 - 1 ) * 4 + 1 ] + colors[ i1 * 4 + 1 ] ) / 2.0 * tauc / 255.0;
		b = b + ( colors[ ( i1 - 1 ) * 4 + 2 ] + colors[ i1 * 4 + 2 ] ) / 2.0 * tauc / 255.0;
		a = a + tauc;
		rInt[i1] = r;
		gInt[i1] = g;
		bInt[i1] = b;
		aInt[i1] = a;
	}
rInt[0] = gInt[0] = bInt[0] = aInt[0] = 0.0;
	// compute look-up table from integral functions
	for ( var sb = 0; sb < 256; sb++ )
	{
		for ( var sf = 0; sf < 256; sf++ )
		{
			if ( sb < sf )
			{
				smin = sb;
				smax = sf;
			}
			else
			{
				smin = sf;
				smax = sb;
			}
			if ( smin != smax)
			{
				factor = 1.0 / (smax -smin);
				rcol = Math.round(( rInt[smax] - rInt[smin] ) * factor);
				gcol = Math.round(( gInt[smax] - gInt[smin] ) * factor);
				bcol = Math.round(( bInt[smax] - bInt[smin] ) * factor);
				acol = Math.round(256.0 * (1.0 - Math.exp(-(aInt[smax] - aInt[smin])*factor/255.0)));
			}
			else
			{
				if ( sb==0 && sf==0)
				{
					rcol = 0;
					gcol = 0;
					bcol = 0;
					acol = Math.round(256.0 * (1.0 - Math.exp(-(aInt[smin])*factor/255.0)));

				}
				else
				{
					rcol = Math.round((lookupImg[(sb-1)*256*4+sf*4+0] + lookupImg[sb*256*4+(sf-1)*4+0]) * 0.5);
					gcol = Math.round((lookupImg[(sb-1)*256*4+sf*4+1] + lookupImg[sb*256*4+(sf-1)*4+1]) * 0.5);
					bcol = Math.round((lookupImg[(sb-1)*256*4+sf*4+2] + lookupImg[sb*256*4+(sf-1)*4+2]) * 0.5);
					acol = Math.round((lookupImg[(sb-1)*256*4+sf*4+3] + lookupImg[sb*256*4+(sf-1)*4+3]) * 0.5);
				}
			}

			rcol = clamp(0,rcol,255);
			gcol = clamp(0,gcol,255);
			bcol = clamp(0,bcol,255);
			acol = clamp(0,acol,255);

			lookupImg[lookupindex++] = rcol;
			lookupImg[lookupindex++] = gcol;
			lookupImg[lookupindex++] = bcol;
			lookupImg[lookupindex++] = acol;
		}
	}
	var texture2 = gl.createTexture();
  if (!texture2) {
      alert('Failed to create texture2');
			return -1;
	}
	  gl.activeTexture(gl.TEXTURE0+2);
	  gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, lookupImg);
}

function createBuffer() {
//创建帧缓冲，一个用于背面，一个用于最后的图像
//加一个，用于正面
//先创建纹理
	backface_buffer = gl.createTexture();//创建贴图对象，并设置为当前贴图对象
  if (!backface_buffer) {
      alert('Failed to create texture');
			return -1;
	}
	gl.activeTexture(gl.TEXTURE0+3);
	gl.bindTexture(gl.TEXTURE_2D, backface_buffer);
    //设置贴图对象的属性
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    framebuffer = gl.createFramebuffer();//创建帧缓冲，并设置为当前工作的帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    //把贴图对象也绑定到帧缓冲中
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, backface_buffer, 0);
    //把贴图对象的图片数据指针注销（交给帧缓冲管理）800, 800
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window_size, window_size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	final_image = gl.createTexture();
  if (!final_image) {
      alert('Failed to create texture');
			return -1;
	}
	  gl.activeTexture(gl.TEXTURE0+4);
	  gl.bindTexture(gl.TEXTURE_2D, final_image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window_size, window_size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    renderbuffer = gl.createRenderbuffer();//创建渲染缓冲，并设置渲染缓冲为当前操作渲染缓冲
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    //设置渲染缓冲区的存储尺寸，尺寸是800*800
    gl.renderbufferStorage(
    gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window_size, window_size);
    //把渲染缓冲绑定到当前工作的帧缓冲上
    gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer
);
}

function render_backface() {
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, backface_buffer, 0);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.FRONT);//把前景去掉
drawQuads(1.0, 1.0, 1.0);
gl.disable(gl.CULL_FACE);
}

function raycasting_pass(perspectiveMatrix, modelMatrix) {
//还是绘制到帧缓冲，只是换一张纹理
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D, final_image, 0
);

  currentProgram = finalProgram;
  gl.useProgram(currentProgram);

  var u_PerspectiveMatrix = gl.getUniformLocation(currentProgram, 'u_PerspectiveMatrix');
	if (!u_PerspectiveMatrix) {
        alert('Failed to get the storage location of u_PerspectiveMatrix');
	return;
	}
  gl.uniformMatrix4fv(u_PerspectiveMatrix, false, perspectiveMatrix.elements);
  var u_ModelViewMatrix2 = gl.getUniformLocation(currentProgram, 'u_ModelViewMatrix');
  gl.uniformMatrix4fv(u_ModelViewMatrix2, false, modelMatrix.elements);

  var u_constantColor = gl.getUniformLocation(currentProgram, 'u_constantColor');
	if (!u_constantColor) {
        alert('Failed to get the storage location of u_constantColor');
	return;
	}
	gl.uniform4f(u_constantColor, contantColor[0], contantColor[1], contantColor[2], contantColor[3]);

	var u_stepsize = gl.getUniformLocation(currentProgram, 'u_stepsize');
	if (!u_stepsize) {
        alert('Failed to get the storage location of u_stepsize');
	return;
	}
	gl.uniform1f(u_stepsize, stepsize);

	var u_Tex = gl.getUniformLocation(currentProgram, 'u_Tex');
	if (!u_Tex) {
	  alert('Failed to get the storage location of u_Tex');
	  return;
	  }
	gl.uniform1i(u_Tex, 3);//backface_buffer

	var u_volumeTex = gl.getUniformLocation(currentProgram, 'u_volumeTex');
	if (!u_volumeTex) {
	  alert('Failed to get the storage location of u_volumeTex');
	  return;
	  }
	gl.uniform1i(u_volumeTex, 0);//volume data

	var u_PreIntergrationTable = gl.getUniformLocation(currentProgram, 'u_PreIntergrationTable');
	if (!u_PreIntergrationTable) {
	  alert('Failed to get the storage location of u_PreIntergrationTable');
	  return;
	  }
	gl.uniform1i(u_PreIntergrationTable, 2);//u_PreIntergrationTable

  var u_Size = gl.getUniformLocation(currentProgram, 'u_Size');
	if (!u_Size) {
	alert('Failed to get the storage location of u_Size');
	return;
	}
	gl.uniform4f(u_Size, xBlock, yBlock, xTexsize, yTexsize);

  var u_zSize = gl.getUniformLocation(currentProgram, 'u_zSize');
	if (!u_zSize) {
	  alert('Failed to get the storage location of u_zSize');
	  return;
	  }
	gl.uniform1f(u_zSize, zSize);

	gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);//把后景去掉
  drawQuads(1.0, 1.0, 1.0);
  gl.disable(gl.CULL_FACE);
}

function render_buffer_to_screen() {
   gl.bindFramebuffer( gl.FRAMEBUFFER,null);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  currentProgram = screenProgram;
  gl.useProgram(currentProgram);
  var u_Tex = gl.getUniformLocation(currentProgram, 'u_Tex');
	if (!u_Tex) {
	  alert('Failed to get the storage location of u_Tex');
	  return;
	  }
	if (toggle_visuals) {
	gl.uniform1i(u_Tex, 4);//final_image
} else {
  gl.uniform1i(u_Tex, 3);//back
}

  gl.viewport(0, 0, window_size, window_size);
	var projMatrix = new Matrix4();
  projMatrix.setOrtho(0.0, 1.0, 0.0, 1.0, 0.0, 1.0);
  var u_ProjMatrix = gl.getUniformLocation(currentProgram, 'u_ProjMatrix');
	if (!u_ProjMatrix) {
	  alert('Failed to get the storage location of u_ProjMatrix');
	  return;
	  }
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  draw_fullscreen_quad();
}

function draw_fullscreen_quad() {
   //gl.disable(gl.DEPTH_TEST);

	 var vertices = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
		]);

	var verticesBuffer = gl.createBuffer();
	if (!verticesBuffer) {
			alert('Failed to create the buffer object');
			return -1;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position1 = gl.getAttribLocation(currentProgram, 'a_Position');
  if(a_Position1 < 0) {
    alert('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position1, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position1);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function drawQuads(x, y, z) {
		var vertices = new Float32Array([
       x, -1.0, -1.0,// v0
    -1.0, -1.0, -1.0,// v1
    -1.0,    y, -1.0,// v2
       x,    y, -1.0,// v3
       x,    y,    z,// v4
       x, -1.0,    z,// v5
    -1.0, -1.0,    z,// v6
    -1.0,    y,    z,// v7
		]);

		var colors = new Float32Array([
		//vertex coordinates and color
       x,  0.0,  0.0,// v0
      0.0, 0.0,  0.0,// v1
      0.0,   y,  0.0,// v2
       x,    y,  0.0,// v3
       x,    y,    z,// v4
       x,  0.0,    z,// v5
      0.0, 0.0,    z,// v6
      0.0,   y,   z,// v7
		]);

		//indices of the vertices
		var indices = new Uint8Array([
		0, 1, 2,   0, 2, 3,//back
		4, 7, 6,   4, 6, 5,//front
		7, 4, 3,   7, 3, 2,//top
		0, 5, 6,   0, 6, 1,//bottom
		1, 6, 7,   1, 7, 2,//left
		0, 3, 4,   0, 4, 5,//right
		]);



	var verticesBuffer = gl.createBuffer();
	var colorsBuffer = gl.createBuffer();
	if (!(verticesBuffer && colorsBuffer)) {
			alert('Failed to create the buffer object');
			return -1;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  var a_Position1 = gl.getAttribLocation(currentProgram, 'a_Position');
  if(a_Position1 < 0) {
    alert('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position1, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position1);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  var a_Color1 = gl.getAttribLocation(currentProgram, 'a_Color');
  if(a_Color1 < 0) {
    alert('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color1, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Color1);

  var indexBuffer = gl.createBuffer();
	if (!indexBuffer) {
			alert('Failed to create the buffer object');
			return -1;
	}
  //write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}

