export const vertexShaderSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform sampler2D u_waveformTex;
uniform float u_waveformTexSize;
uniform float u_progress;
uniform float u_hoverX;
uniform vec3 u_barColor;
uniform vec3 u_progressColor;
uniform vec3 u_hoverColor;
uniform vec3 u_bgColor;
uniform float u_barWidth;
uniform float u_gap;
uniform float u_barRadius;
uniform float u_playheadX;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  st.y = 1.0 - st.y;

  float totalBarWidth = u_barWidth + u_gap;
  float barIndex = floor(st.x * u_resolution.x / totalBarWidth);
  float barX = barIndex * totalBarWidth / u_resolution.x;
  float barRight = barX + u_barWidth / u_resolution.x;

  float inBar = step(barX, st.x) * step(st.x, barRight);

  float sampleX = barIndex / u_waveformTexSize;
  float amplitude = texture2D(u_waveformTex, vec2(sampleX, 0.5)).r;

  float distFromCenter = abs(st.y - 0.5) * 2.0;
  float inWaveform = step(distFromCenter, amplitude) * inBar;

  float edgeSoftness = u_barRadius / u_resolution.x;
  float distFromBarX = min(st.x - barX, barRight - st.x);
  float cornerMask = step(0.0, distFromBarX - edgeSoftness);
  inWaveform *= cornerMask;

  float isProgress = step(st.x, u_progress);
  vec3 baseColor = mix(u_barColor, u_progressColor, isProgress);

  float hoverDist = abs(st.x - u_hoverX);
  float hoverLine = step(hoverDist, 1.0 / u_resolution.x) * step(0.0, u_hoverX);
  vec3 color = mix(baseColor, u_hoverColor, hoverLine);

  float playheadDist = abs(st.x - u_playheadX);
  float playheadLine = step(playheadDist, 1.0 / u_resolution.x);
  color = mix(color, u_progressColor, playheadLine * 0.5);

  vec3 finalColor = mix(u_bgColor, color, inWaveform);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;
