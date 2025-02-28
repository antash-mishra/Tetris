import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'
import Tetris from './Tetris'
import { Shape } from './components/Shape'
import { TransformControls } from '@react-three/drei'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Canvas
        orthographic
        
        camera={{
            position: [0, 0, 5],
            fov: 45,
            near: 0,
            far: 1000,
            zoom: 200
        }}
      >
        <TransformControls>
          <Tetris />
        </TransformControls>
        <Shape />
      </Canvas>
    </>
  )
}

export default App
