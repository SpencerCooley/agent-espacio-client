import { vertexShaderSource, fragmentShaderSource } from './shaders';

export function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function initWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return null;
  return gl;
}

export function setupFullScreenQuad(gl: WebGLRenderingContext, program: WebGLProgram) {
  const positionLoc = gl.getAttribLocation(program, 'position');
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
}

export function createWaveformTexture(gl: WebGLRenderingContext, data: Float32Array): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;
  // Convert Float32Array to Uint8Array for universal WebGL 1.0 support
  const normalized = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    normalized[i] = Math.min(255, Math.max(0, Math.round(data[i] * 255)));
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    data.length,
    1,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    normalized
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram) {
  return {
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    waveformTex: gl.getUniformLocation(program, 'u_waveformTex'),
    waveformTexSize: gl.getUniformLocation(program, 'u_waveformTexSize'),
    progress: gl.getUniformLocation(program, 'u_progress'),
    hoverX: gl.getUniformLocation(program, 'u_hoverX'),
    barColor: gl.getUniformLocation(program, 'u_barColor'),
    progressColor: gl.getUniformLocation(program, 'u_progressColor'),
    hoverColor: gl.getUniformLocation(program, 'u_hoverColor'),
    bgColor: gl.getUniformLocation(program, 'u_bgColor'),
    barWidth: gl.getUniformLocation(program, 'u_barWidth'),
    gap: gl.getUniformLocation(program, 'u_gap'),
    barRadius: gl.getUniformLocation(program, 'u_barRadius'),
    playheadX: gl.getUniformLocation(program, 'u_playheadX'),
  };
}

export function compileShaders(gl: WebGLRenderingContext) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vs || !fs) return null;
  const program = createProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}
