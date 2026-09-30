/**
 * Pixel-dithered fog of war as a custom Mesh shader.
 *
 * The mesh is a quad covering the plane in world space. Its UVs sample the
 * low-resolution reveal mask (alpha = revealed) and also give world
 * coordinates, so the 4x4 Bayer dither cells (2 world units each) and the
 * drifting noise are locked to the map: they scale with zoom like the rest
 * of the pixel art and never crawl while panning.
 *
 * WebGL only (the renderer is created with preference: 'webgl'). Pixi binds
 * uProjectionMatrix / uWorldTransformMatrix (global group) and
 * uTransformMatrix (local group) for custom mesh shaders.
 */

import { MeshGeometry, Shader, Texture, UniformGroup } from 'pixi.js';
import { hexToRgb01 } from '../scene/pixel-palette';

const vertex = `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

const fragment = `
in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uOpacity;
uniform float uTime;
uniform vec2 uWorldSize;

float bayer4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int idx = x + y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[idx]) + 0.5) / 16.0;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 world = vUV * uWorldSize;
  vec2 cell = floor(world / 2.0);
  float reveal = texture(uTexture, vUV).a;
  float drift = noise(world * 0.012 + vec2(uTime * 0.05, uTime * 0.02));
  float fog = clamp(1.0 - reveal, 0.0, 1.0);
  float density = fog * (0.82 + 0.18 * drift);
  float visible = step(bayer4(cell), density);
  float alpha = uOpacity * visible * (0.9 + 0.1 * drift);
  finalColor = vec4(uFogColor * alpha, alpha);
}
`;

export function createFogQuad(width: number, height: number): MeshGeometry {
  return new MeshGeometry({
    positions: new Float32Array([0, 0, width, 0, width, height, 0, height]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
}

export interface DitherFogOptions {
  mask: Texture;
  color: string;
  opacity: number;
  worldWidth: number;
  worldHeight: number;
}

export class DitherFogMaterial {
  public readonly shader: Shader;
  private readonly uniforms: UniformGroup;

  constructor(options: DitherFogOptions) {
    this.uniforms = new UniformGroup({
      uFogColor: { value: new Float32Array(hexToRgb01(options.color)), type: 'vec3<f32>' },
      uOpacity: { value: options.opacity, type: 'f32' },
      uTime: { value: 0, type: 'f32' },
      uWorldSize: { value: new Float32Array([options.worldWidth, options.worldHeight]), type: 'vec2<f32>' },
    });
    this.shader = Shader.from({
      gl: { vertex, fragment },
      resources: {
        uTexture: options.mask.source,
        uSampler: options.mask.source.style,
        fogUniforms: this.uniforms,
      },
    });
  }

  public get time(): number {
    return this.uniforms.uniforms.uTime as number;
  }

  public set time(seconds: number) {
    this.uniforms.uniforms.uTime = seconds;
  }

  public destroy(): void {
    this.shader.destroy();
  }
}
