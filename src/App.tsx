import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import './App.css'
import Tetris from './Tetris'
import { Shape } from './components/Shape'
import { TransformControls, OrbitControls, PivotControls } from '@react-three/drei'
import * as THREE from 'three'
import { ShapeType } from './components/Shape'

function ShapeMovement({ rotation, onShapeLanded, shapeType }: { 
  rotation: number,
  onShapeLanded: () => void,
  shapeType: ShapeType
})
{
  
  const shape = useRef<THREE.Group>(new THREE.Group());
  const startY = 2.5;  // Start position at top
  const endY = -2.75;   // End position at bottom
  const speed = 0.5;     // Speed of descent (adjust as needed)
  const [xPosition, setXPosition] = useState(-0.5); // Track x position
  const [hasLanded, setHasLanded] = useState(false);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (hasLanded) return;

      switch (event.key) {
        case 'ArrowLeft':
          // Move left, but not beyond left boundary (-1.25)
          setXPosition(prev => Math.max(-1.25, prev - 0.25));
          break;
        case 'ArrowRight':
          // Move right, but not beyond right boundary (0.50)
          setXPosition(prev => Math.min(0.50, prev + 0.25));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  useFrame((state) => {
    if (!shape.current || hasLanded) return;

    const time = state.clock.getElapsedTime();
    const newY = startY - (time * speed);
    console.log(newY, "Time: " ,time);

    shape.current.position.x = xPosition;

    // Stop at bottom position
    if (newY > endY) {
      shape.current.position.y = newY;
    } else {
      shape.current.position.y = endY;
      setHasLanded(true);
      onShapeLanded(); // Trigger new shape spawn
    }
  });

  return (
    <group ref={shape} position={[xPosition, startY, 0]}>
      <Shape shapeType={shapeType} rotation={rotation}/>
    </group>
  );

}

function App() {

  const [rotation, setRotation] = useState(0);
  const [currentShape, setCurrentShape] = useState<ShapeType>('T');
  const shapes: ShapeType[] = ['T', 'L', 'I', 'O', 'S', 'Z', 'J'];

  const handleRotate = () => {
    setRotation(prev => (prev + 1) % 4); // Increment rotation state (0-3)
  };

  const handleShapeLanded = () => {
    // Get random shape type for next piece
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];  
    setCurrentShape(randomShape);
  };

  return (
    <>
      <button 
        onClick={handleRotate}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}
      >
        Rotate
      </button>
      <Canvas
        orthographic        
        camera={{
          position: [0, 0, 10],
          fov: 90,
          near: 0,
          far: 1000,
          zoom: 200
        }}
      >
        <Tetris />
        <ShapeMovement 
          rotation={rotation} 
          onShapeLanded={handleShapeLanded}
          shapeType={currentShape}
        />
        <OrbitControls />
      </Canvas>
    </>
  )
}

export default App
