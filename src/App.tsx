import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import './App.css'
import Tetris from './Tetris'
import { Shape } from './components/Shape'
import { TransformControls, OrbitControls, PivotControls } from '@react-three/drei'
import * as THREE from 'three'
import { ShapeType } from './components/Shape'

type ShapeState = {
  id: number,
  type: ShapeType,
  position: {
    x: number,
    y: number,
    z: number
  },
  hasLanded: boolean,
  rotation: number
}

function ShapeMovement({  shapeState, onShapeLanded, onUpdatePosition, onRotate }: { 
  shapeState: ShapeState,
  onShapeLanded: (id: number) => void,
  onUpdatePosition: (id: number, x: number, y: number) => void,
  onRotate: () => void
})

{
  
  const shape = useRef<THREE.Group>(new THREE.Group());
  const startTime = useRef(performance.now() / 1000);
  const startY = 2.5;
  const endY = -2.75;
  const speed = 1;

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (shapeState.hasLanded) return;

      switch (event.key) {
        case 'ArrowLeft':
          // Move left, but not beyond left boundary (-1.25)
          onUpdatePosition(
            shapeState.id,
            Math.max(-1.25, shapeState.position.x - 0.25),
            shapeState.position.y
          );
          break;
        case 'ArrowRight':
          // Move right, but not beyond right boundary (0.50)
          onUpdatePosition(
            shapeState.id,
            Math.min(0.50, shapeState.position.x + 0.25),
            shapeState.position.y
          );
          break;

        case 'ArrowUp':
          onRotate();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapeState]);

  useFrame((state) => {

    if (!shape.current || shapeState.hasLanded) return;

    const elapsedTime = state.clock.getElapsedTime() - startTime.current;
    const newY = startY - (elapsedTime * speed);


    // Stop at bottom position
    if (newY > endY) {
      onUpdatePosition(shapeState.id, shapeState.position.x, newY);
    } else {
      onUpdatePosition(shapeState.id, shapeState.position.x, endY);
      onShapeLanded(shapeState.id); // Trigger new shape spawn
    }
  });

  return (  
    <group 
      ref={shape} 
      position={[shapeState.position.x, shapeState.position.y, shapeState.position.z]}>
      <Shape shapeType={shapeState.type} rotation={shapeState.rotation}/>
    </group>
  );
  

}

function App() {

  const [shapes, setShapes] = useState<ShapeState[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const shapeTypes: ShapeType[] = ['T', 'L', 'I', 'O', 'S', 'Z', 'J'];


  //Initialize shapes
  // Initialize the game with first shape
  useEffect(() => {
    if (!isInitialized) {
      const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      setShapes([{
        id: 1,
        type: randomType,
        position: {x: -0.5, y: 2.5, z: 0},
        hasLanded: false,
        rotation: 0
      }]);
      setNextId(2);
      setIsInitialized(true);
    }
  }, [isInitialized]);


  const spawnNewShape = () => {
    const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    console.log("randomType", randomType, Math.floor(Math.random() * shapeTypes.length));
    const newShape: ShapeState = {
      id: nextId,
      type: randomType,
      position: {x: -0.5, y: 2.5, z: 0},
      hasLanded: false,
      rotation: 0
    };

    setShapes(prev => [...prev, newShape]);
    setNextId(prev => prev + 1);
  };

  const handleShapeLanded = (id: number) => {
    setShapes(prev => prev.map(shape => 
      shape.id === id 
        ? { ...shape, hasLanded: true }
        : shape
    ));
    spawnNewShape();
  };
  
  const handleUpdatePosition = (id:number, x:number, y:number) => {
    setShapes(prev => prev.map(shape => 
      shape.id === id ? {...shape, position: {...shape.position, x, y}} : shape
    ));
  };

  const handleRotate = () => {
    // Rotate only the active (non-landed) shape
    setShapes(prev => prev.map(shape =>
      !shape.hasLanded
        ? { ...shape, rotation: (shape.rotation + 1) % 4 }
        : shape
    ));
  };

  return (
    <>
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
        {shapes.map((shape, index) => (
          <ShapeMovement 
            key={shape.id+index}
            shapeState={shape}
            onShapeLanded={handleShapeLanded}
            onUpdatePosition={handleUpdatePosition}
            onRotate={handleRotate}
          />
        ))}

        <OrbitControls />
      </Canvas>
    </>
  )
}

export default App
