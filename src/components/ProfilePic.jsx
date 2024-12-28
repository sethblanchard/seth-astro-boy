import { useRef } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { shaderMaterial, Plane, useTexture } from '@react-three/drei'

export const App = () => (
  <>
    <h1>Pseudo 3D Background</h1>
    <Canvas>
      <Model />
    </Canvas>
  </>
)

function Model(props) {
  const depthMaterial = useRef()
  const texture = useTexture('profile-dithered_x2.jpg')
  const depthMap = useTexture('Profile_opt2_depth_colored_x2.png')
  const { viewport } = useThree()
  useFrame((state) => (depthMaterial.current.uMouse = [state.mouse.x * 0.025, state.mouse.y * 0.025]))
  return (
    <Plane args={[1, 1]} scale={[viewport.width/4, viewport.height/4, 1]}>
      <pseudo3DMaterial ref={depthMaterial} uImage={texture} uDepthMap={depthMap} />
    </Plane>
  )
}

extend({
  Pseudo3DMaterial: shaderMaterial(
    { uMouse: [0, 0], uImage: null, uDepthMap: null },
    `
    varying vec2 vUv;
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;
      gl_Position = projectionPosition;
      vUv = uv;
    }`,
    `
    precision mediump float;

    uniform vec2 uMouse;
    uniform sampler2D uImage;
    uniform sampler2D uDepthMap;

    varying vec2 vUv;
  
    vec4 linearTosRGB( in vec4 value ) {
      return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
    }
    
    
    void main() {
       vec4 depthDistortion = texture2D(uDepthMap, vUv);
       float parallaxMult = depthDistortion.r;

       vec2 parallax = (uMouse) * parallaxMult * vec2(5,5);

       vec4 original = texture2D(uImage, (vUv + parallax));
       gl_FragColor = linearTosRGB(original);
    }
    `,
  ),
})
