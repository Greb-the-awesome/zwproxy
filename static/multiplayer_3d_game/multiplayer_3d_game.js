var canvas, gl, shaderProgram;
const vsSource = `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
}
`;
const fsSource = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`
var programInfo;
var downKeys = [];
var modelViewMatrix, projectionMatrix;


//
// Initialize a shader program, so WebGL knows how to draw our data
//

function initShaderProgram() {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function initBuffers() {
    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the square.

    const positions = [
       -1.0,  1.0,
        1.0,  1.0,
       -1.0, -1.0,
        1.0, -1.0,
    ];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
  
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(positions),
                  gl.DYNAMIC_DRAW);

    const colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
    ];

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//

function loadShader(type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initStuff() {
    
}

function drawScene(buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    projectionMatrix = glMatrix.mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    glMatrix.mat4.perspective(projectionMatrix,
                     fieldOfView,
                     aspect,
                     zNear,
                     zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    modelViewMatrix = glMatrix.mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   [-0.0, 0.0, -6.0]);  // amount to translate

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
                                  // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
              programInfo.attribLocations.vertexPosition,
              numComponents,
              type,
              normalize,
              stride,
              offset);
        gl.enableVertexAttribArray(
              programInfo.attribLocations.vertexPosition);
    }

    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }

    // Tell WebGL to use our program when drawing
  
    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}

function onKeyDown(event) {
    var keyCode = event.keyCode;
    downKeys[keyCode] = true;
}

function onKeyUp(event) {
    keyCode = event.keyCode;
    downKeys[keyCode] = false;
}

function onLoad() {
    console.log(a);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    canv = document.getElementById("canvas");
    gl = canv.getContext("webgl");
    // gl.canvas.width = window.innerWidth;
    // gl.canvas.height = window.innerHeight;

    if (gl === null || gl === undefined) { // no webgl for ye
        window.alert("no webgl for ye todoi");
        return;
    }
    shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };


    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    initStuff();

    window.setInterval(loop, 30);
    drawScene(initBuffers());
}

function loop() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (downKeys[65]) {
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, 6.0]);
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, 0.07, [0.0, 1.0, 0.0]);
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
    }
    if (downKeys[68]) {
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, 6.0]);
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, -0.07, [0.0, 1.0, 0.0]);
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
    }
    if (downKeys[87]) {
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, 6.0]);
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, 0.07, [1.0, 0.0, 0.0]);
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
    }
    if (downKeys[83]) {
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, 6.0]);
        glMatrix.mat4.rotate(modelViewMatrix, modelViewMatrix, -0.07, [1.0, 0.0, 0.0]);
        glMatrix.mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
    }
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}

window.onload = onLoad();