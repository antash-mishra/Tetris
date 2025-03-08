import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import './App.css'
import Tetris from './Tetris'
import { Shape } from './components/Shape'
import { TransformControls, OrbitControls, PivotControls } from '@react-three/drei'
import * as THREE from 'three'
import { ShapeType } from './components/Shape'
import { Figures } from './components/figures'


type GridCell = {
  occupied: boolean,
  shapeId: number | null
}

type ShapeState = {
  id: number,
  type: ShapeType,
  position: {
    x: number,
    y: number,
    z: number
  },
  hasLanded: boolean,
  rotation: number,
  shapeMaxWidth: number
}

const BOARD_HEIGHT = 5;
const CELL_SIZE = 0.25;

function ShapeMovement({ shapeState, onShapeLanded, onUpdatePosition, onRotate }: {
  shapeState: ShapeState,
  onShapeLanded: (id: number) => void,
  onUpdatePosition: (id: number, x: number, y: number) => void,
  onRotate: () => void
}) {

  const shape = useRef<THREE.Group>(new THREE.Group());
  const startTime = useRef(new THREE.Clock()) // Each mesh gets its own clock
  const hasLandedRef = useRef(false);
  const startY = 2.5;
  const endY = -2.75;
  const speed = 0.5;

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
            Math.min(1.0 - ((shapeState.shapeMaxWidth - 1)*0.25) , shapeState.position.x + 0.25),
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

  useFrame((state, delta) => {

    if (!shape.current || shapeState.hasLanded) return;
    // console.log(state.clock.getElapsedTime());
    console.log(shapeState.position.x)
    // console.log(shapeState.rotation)
    //const elapsedTime =   state.clock.getElapsedTime() - startTime.current;
    const elapsedTime = startTime.current.getElapsedTime()
    
  
    // ShapeMatrix length addition
    const newY = (startY) - (elapsedTime * speed);

    // console.log("NewY: ", newY)
    // Stop at bottom position
    if (newY > endY) {
      onUpdatePosition(shapeState.id, shapeState.position.x, newY);
    } else {
      hasLandedRef.current = true;
      onUpdatePosition(shapeState.id, shapeState.position.x, endY);
      onShapeLanded(shapeState.id); // Trigger new shape spawn
    }
  });

  return (
    <group
      ref={shape}
      position={[shapeState.position.x, shapeState.position.y, shapeState.position.z]}>
      <Shape shapeType={shapeState.type} rotation={shapeState.rotation} />
    </group>
  );
}

function App() {

  const [shapes, setShapes] = useState<ShapeState[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const shapeTypes: ShapeType[] = ['T', 'L', 'I', 'O', 'S', 'Z', 'J'];

  // Crate Grid to track occupied cells (20 rows, 10 columns)
  const [grid, setGrid] = useState<GridCell[][]>(Array.from({ length: 20 }, () => Array(10).fill({ occupied: false, shapeId: null })));

  // Covert world coordinates to grid coordinates
  const worldToGrid = (x: number, y: number) => {
    const gridX = Math.floor((x + 1.25) / 0.25);
    const gridY = Math.floor((y + 2.5) / 0.25);
    return [gridX, gridY];
  }

  const getShapeMatrix = (shapeType: ShapeType, rotation: number): string[] => {
    let matrix = Figures[shapeType];
    for (let i = 0; i < rotation; i++) {
      matrix = Shape.prototype.rotateShape(matrix);
    }
    return matrix;
  }


  // Check if a cell is valid (no collision with other shapes)
  const isValidPosition = (shapeType: ShapeType, x: number, y: number, rotation: number) => {
    const cells = getShapeMatrix(shapeType, rotation);
    const [gridX, gridY] = worldToGrid(x, y);
    // console.log("All: ", gridX, gridY)
    for (let row = 0; row < cells.length; row++) {
      for (let col = 0; col < cells[row].length; col++) {
        if (cells[row][col] === '#') {
          const newX = gridX + col ;
          // make the height to 0, for any shapeType
          const newY = gridY - row + cells.length
          // console.log(newX)
          if (newX < 0 || newX >= 10 || newY < 0 || newY > (20+cells.length)) return false;
          if (newY < 20) {
            if (grid[newY][newX].occupied) return false;
          }
        }
      }
    }
    return true;
  };


  // Initialize the game with first shape
  useEffect(() => {
    if (!isInitialized) {
      const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
      setShapes([{
        id: 1,
        type: randomType,
        position: { x: -1.25, y: 2.5, z: 0 },
        hasLanded: false,
        rotation: 0,
        shapeMaxWidth: Math.max(...Figures[randomType].map((row) => {
          return row.split('').length
        }).values())
      }]);
      setNextId(2);
      setIsInitialized(true);
    }
  }, [isInitialized]);


  const spawnNewShape = () => {
    const randomType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const newShape: ShapeState = {
      id: nextId,
      type: randomType,
      position: { x: -0.5, y: 2.5, z: 0 },
      hasLanded: false,
      rotation: 0,
      shapeMaxWidth: Math.max(...Figures[randomType].map((row, indexX) => {
        return row.split('').length
      }).values())
    };

    setShapes(prev => [...prev, newShape]);
    setNextId(prev => prev + 1);
  };

  const handleShapeLanded = (id: number) => {

    const shape = shapes.find(shape => shape.id === id);
    if (!shape) return;

    const shapeMatrix = getShapeMatrix(shape.type, shape.rotation);
    const [gridX, gridY] = worldToGrid(shape.position.x, shape.position.y);
    // console.log("Grid: ", gridX, gridY);
    setGrid(prev => {
      const newGrid = [...prev.map(row => [...row])];
      for (let row = 0; row < shapeMatrix.length; row++) {
        for (let col = 0; col < shapeMatrix[row].length; col++) {
          if (shapeMatrix[row][col] === '#') {
            const newX = gridX + col ;
            const newY = gridY - row + shapeMatrix.length;
            // console.log(newX, newY);
            if (newX >= 0 && newX < 10 && newY >= 0 && newY <= (20+shapeMatrix.length)) {
              if (newY <= 20) {
                newGrid[newY][newX] = { occupied: true, shapeId: id };
              }
            } 
          }
        }
      }
      return newGrid;
    });

    setShapes(prev => prev.map(shape =>
      shape.id === id
        ? { ...shape, hasLanded: true }
        : shape
    ));

    checkCompletedRows();

    // Spawn new shape
    spawnNewShape();
  };

  const checkCompletedRows = () => {
    setGrid(prev => {
      const newGrid = [...prev];

      let row = 0;
      // console.log("New Grid: ", row, newGrid)
      while (row >= 0 && newGrid.length < 20) {
        if (newGrid[row].every(cell => cell.occupied)) {
          // Row is completed, remove it
          newGrid.splice(row, 1);
          // console.log("true")
          // Add new row at the top
          newGrid.unshift(Array(10).fill({ occupied: false, shapeId: null }));
        } else {
          // console.log("false")
          row++;
          
        }
      }
      return newGrid;
    });
  };

  const handleUpdatePosition = (id: number, x: number, y: number) => {

    const shape = shapes.find(shape => shape.id === id);
    if (!shape || shape.hasLanded) return;
    
    if (isValidPosition(shape.type, x, y, shape.rotation)) {
      setShapes(prev => prev.map(shape =>
        shape.id === id ? { ...shape, position: { ...shape.position, x, y } } : shape
      ));
    }
  };

  const handleRotate = () => {
    // Rotate only the active (non-landed) shape
    setShapes(prev => prev.map(shape =>
      !shape.hasLanded
        ? { ...shape, rotation: (shape.rotation + 1) % 4, 
            shapeMaxWidth: Math.max(...getShapeMatrix(shape.type, (shape.rotation + 1) % 4).map((row) => {
              return row.split('').length
            }).values()) 
          } : shape
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
            key={shape.id + index}
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
