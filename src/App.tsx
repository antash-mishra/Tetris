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
      
      // Collect shape IDs that are affected by row completion
      const affectedShapeIds: Set<number> = new Set<number>();
      
      // Make sure we don't go beyond the grid's length
      while (row < newGrid.length) {
        // Check if the row exists before calling .every()
        if (newGrid[row] && newGrid[row].every(cell => cell.occupied)) {
          console.log("Row Completed: ", row, newGrid[row]);
          // Collect shape IDs in a completed Row
          newGrid[row].forEach(cell => {
            if (cell.shapeId !== null) {
              affectedShapeIds.add(cell.shapeId);
            }
          });

          // Row is completed, remove it
          newGrid.splice(row, 1);
          
          // Add new row at the top
          newGrid.unshift(Array(10).fill({ occupied: false, shapeId: null }));
          

          // Don't increment row here since we've removed the current row
          // and the next row has shifted up to the current position
        } else {
          // Only increment row if we didn't remove a row
          row++;
        }
      }
      
      // Cleanup shapes that are no longer needed
      cleanupRemovedShapes(newGrid, affectedShapeIds);
      
      return newGrid;
    });
  };

  const cleanupRemovedShapes = (grid: GridCell[][], affectedShapeIds: Set<number>) => {
    console.log("Cleanup: ", affectedShapeIds)
    // First, find which shape IDs still exist in the grid
    const remainingShapeIds = new Set<number>();
    
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.shapeId !== null) {
          remainingShapeIds.add(cell.shapeId);
        }
      });
    });
    
    // Remove shapes that are no longer in the grid
    setShapes(prev => prev.filter(shape => {
      // Keep shapes that aren't landed
      if (!shape.hasLanded) return true;
      
      // Keep landed shapes that weren't affected by row clearing
      if (!affectedShapeIds.has(shape.id)) return true;
      
      // For affected shapes, only keep them if they still have cells in the grid
      return remainingShapeIds.has(shape.id);
    }));
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
    setShapes(prev => prev.map(shape => {
      if (!shape.hasLanded) {
        
        // Calculate new rotation
        const newRotation = (shape.rotation + 1) % 4
        
        // Get the rotated shape matrix and width
        const rotatedMatrix = getShapeMatrix(shape.type, newRotation);
                // Calculate max width properly by counting only non-space characters
        const shapeMaxWidth = Math.max(...rotatedMatrix.map(row => {
          // Trim trailing spaces and count length
          return row.trimEnd().length;
        }));

        // Get current shape width
        const currentMatrix = getShapeMatrix(shape.type, shape.rotation);
        const currentWidth = Math.max(...currentMatrix.map(row => row.trimEnd().length));

        // Only check boundaries if the width actually changes
        if (shapeMaxWidth !== currentWidth) {
          // Check if rotation would cause the shape to go out of bounds
          const newX = shape.position.x; // => 0.75
          const rightBoundary = 1.0 - ((shapeMaxWidth - 1) * 0.25); // => 0.25
          
          // If rotation would cause out of bounds, adjust position if possible
          if (newX > rightBoundary && rightBoundary >= -1.25) {
            console.log("Right Boundary: ", rightBoundary, newX, shapeMaxWidth, currentWidth, newRotation,  rotatedMatrix)  
            return {
              ...shape,
              rotation: newRotation,
              shapeMaxWidth: shapeMaxWidth,
              position: {
                ...shape.position,
                x: rightBoundary
              }
            };
          }
        }
        
        // If no adjustment needed, just update rotation and width
        return {
          ...shape,
          rotation: newRotation,
          shapeMaxWidth: shapeMaxWidth
        };
      }

      return shape;

    }));
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
