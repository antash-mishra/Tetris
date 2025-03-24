import React, { useState, useRef, useEffect, useCallback, use } from 'react'
import { Canvas, events, useFrame, useThree } from '@react-three/fiber'
import './App.css'
import Tetris from './Tetris'
import { Shape } from './components/Shape'
import * as THREE from 'three'
import { ShapeType } from './components/Shape'
import { Figures } from './components/figures'
import TetrisLights from './components/TetrisLights'
import { useSpring, animated } from '@react-spring/three'

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
  shapeMaxWidth: number,
  customMatrix?: string[],
  cells?: { x: number; y: number }[]; // Stores exact occupied grid positions
  removed?: boolean,
}

const BOARD_HEIGHT = 5;
const CELL_SIZE = 0.25;

// Debounce function to limit how often a function can be called
function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


function ShapeMovement({ shapeState, onUpdatePosition, updateAndLandShape, onRotate, isGameOver, isValidPosition }: {
  shapeState: ShapeState,
  onUpdatePosition: (id: number, x: number, y: number) => void,
  updateAndLandShape: (id: number, x: number, y: number) => void,
  onRotate: () => void,
  isGameOver: boolean,
  isValidPosition: (shapeType: ShapeType, x: number, y: number, rotation: number) => boolean
}) {
  const [spring, api] = useSpring(() => ({
    position: [shapeState.position.x, shapeState.position.y, shapeState.position.z],
    config: { mass: 0.7, tension: 170, friction: 20 }
  }));

  const shape = useRef<THREE.Group>(new THREE.Group());
  const startTime = useRef(new THREE.Clock()); // Use a single clock instance
  const hasLandedRef = useRef(false);
  const lastValidGridPosition = useRef(shapeState.position.y);
  const crossedGridLine = useRef(false);

  const startY = 2.5;
  const endY = -2.75;
  const gridSize = 0.25;
  
  const normalSpeed = 0.5; // Normal falling speed
  const fastSpeed = 1.5;   // Fast falling speed when down arrow is pressed

  const [speed, setSpeed] = useState(normalSpeed);
  

  // Handle keyboard controls
  useEffect(() => {
    if (isGameOver) return; // Prevent further actions if game is over

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shapeState.hasLanded) return;
      switch (event.key) {
        case 'ArrowLeft':
          console.log("Arrow left")
          // Move left, but not beyond left boundary (-1.25)
          const animateLeft = () => {
            requestAnimationFrame(() => {
            onUpdatePosition(
              shapeState.id,
              Math.max(-1.25, shapeState.position.x - 0.25),
              shapeState.position.y
            );
            });
          };
          animateLeft();
          break;

        case 'ArrowRight':
          console.log("Arrow right:", shapeState.position.x, shapeState.id, shapeState.shapeMaxWidth)         // Move right, but not beyond right boundary (0.50)
          const animateRight = () => {
            requestAnimationFrame(() => {
              onUpdatePosition(
                shapeState.id,
                Math.min(1.0 - ((shapeState.shapeMaxWidth - 1)*0.25) , shapeState.position.x + 0.25),
                shapeState.position.y
              );
            });
          };
          animateRight();

          console.log("Arrow right 1:", shapeState.position.x, shapeState.id)
          break;

        case 'ArrowUp':
          onRotate();
          break;

        case 'ArrowDown':
          startTime.current.elapsedTime += 0.2;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        setSpeed(normalSpeed); // Reset to normal speed when down arrow is released
      }
    };


    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    api.start({ position: [shapeState.position.x, shapeState.position.y, shapeState.position.z] });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [event]);

  useFrame(() => {
    if (!shape.current || shapeState.hasLanded || hasLandedRef.current || isGameOver) return;
    
    // Calculate continuous position for smooth visual movement
    const elapsedTime = startTime.current.getElapsedTime();
    const continuousY = Number((startY - (elapsedTime * speed)).toFixed(2));
    
    // Get grid-aligned positions
    const currentGridY = Math.floor(shapeState.position.y / gridSize) * gridSize;
    const nextGridY = Math.floor(continuousY / gridSize) * gridSize;
    
    // Only check for collisions when crossing grid boundaries
    if (nextGridY !== currentGridY) {
      crossedGridLine.current = true;
      
      // Check if next grid position is valid
      const nextPositionValid = isValidPosition(
        shapeState.type, 
        shapeState.position.x, 
        nextGridY, 
        shapeState.rotation
      );

      console.log("New Y: ", continuousY, currentGridY, nextGridY, nextPositionValid, lastValidGridPosition.current)
      
      if (nextPositionValid) {
        // Update last valid position
        lastValidGridPosition.current = nextGridY;
        // Continue with continuous movement
        onUpdatePosition(shapeState.id, shapeState.position.x, continuousY);
      } else {
        // Shape has landed at last valid position
        hasLandedRef.current = true;
        
        // Update position first, then mark as landed
        updateAndLandShape(
          shapeState.id,
          shapeState.position.x, 
          lastValidGridPosition.current
        );
        return;
      }
    } 
    
    else if (crossedGridLine.current || Math.abs(continuousY - shapeState.position.y) > 0.02) {
      console.log("New Y 2: ", continuousY, currentGridY, nextGridY)

      // Apply continuous movement when needed
      // The small threshold prevents unnecessary updates for tiny movements
      onUpdatePosition(shapeState.id, shapeState.position.x, continuousY);
      crossedGridLine.current = false;
    }
  });

  return (
    <>
      <animated.group
        ref={shape}
        position={spring.position}>
        <Shape 
          shapeType={shapeState.type} 
          rotation={shapeState.rotation} 
          customMatrix={shapeState.customMatrix} /> 
      </animated.group>
    </>
  );
}

function App() {

  const [shapes, setShapes] = useState<ShapeState[]>([]);
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [highScores, setHighScores] = useState<{name: string, score: number, rank: number}[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const shapeTypes: ShapeType[] = ['T', 'L', 'I', 'O', 'J'];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Crate Grid to track occupied cells (20 rows, 10 columns)
  const [grid, setGrid] = useState<GridCell[][]>(Array.from({ length: 20 }, () => Array(10).fill({ occupied: false, shapeId: null })));

  // Covert world coordinates to grid coordinates
  const worldToGrid = (x: number, y: number) => {
    const gridX = Math.floor((x + 1.25) / 0.25);
    const gridY = Math.floor((y + 2.5) / 0.25);
    return [gridX, gridY];
  }

  const getShapeMatrix = (shapeType: ShapeType, rotation: number, customMatrix?: string[]): string[] => {
    if (shapeType === 'custom' && customMatrix) {
      return customMatrix;
    }
  
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
        }).values()),

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
      shapeMaxWidth: Math.max(...Figures[randomType].map((row) => {
        return row.split('').length
      }).values())
    };

    setShapes(prev => [...prev, newShape]);
    setNextId(prev => prev + 1);
  };

  // Function to check for completed rows in the grid
  const checkCompletedRows = (currentGrid: GridCell[][]): number[] => {
    const completedRows: number[] = [];
    
    // Check each row in the grid
    for (let row = 0; row < currentGrid.length; row++) {
      // If every cell in the row is occupied, it's a completed row
      if (currentGrid[row].every(cell => cell.occupied)) {
        completedRows.push(row);
      }
    }
    
    // Return array of completed row indices (sorted from bottom to top)
    return completedRows.sort((a, b) => b - a);
  };

  // Function to fetch high scores
  const fetchHighScores = () => {
    fetch('http://192.168.1.9:8080/scores')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setHighScores(data); // Assuming you have a state for high scores
      })
      .catch(error => {
        console.error('Error fetching high scores:', error);
      });
  };

  // Add this function to the App component
  const updateAndLandShape = (id: number, x: number, y: number) => {
    console.log("Updating and landing shape:", id, "Position:", x, y);

    // First, find the shape
    const shape = shapes.find(shape => shape.id === id);
    if (!shape) return;

    // Get the shape matrix
    const shapeMatrix = getShapeMatrix(shape.type, shape.rotation);
    const [gridX, gridY] = worldToGrid(x, y);

    // Check for game over condition
    if ((gridY + shapeMatrix.length) >= 18) {
      setIsGameOver(true);

      fetch('http://192.168.1.9:8080/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'PlayerName', score }),
      })
      .then(response => {
        console.log("Status: ", response.status);
      })
      .then(data => {
        fetchHighScores();
      })
      .catch(error => {
        console.error('Error saving score:', error);
      });  
      return;
    }

    // Calculate exact grid positions for the shape
    const shapeCells: { x: number; y: number }[] = [];
    for (let row = 0; row < shapeMatrix.length; row++) {
      for (let col = 0; col < shapeMatrix[row].length; col++) {
        if (shapeMatrix[row][col] === '#') {
          const cellX = gridX + col;
          const cellY = gridY - row + shapeMatrix.length;
          if (cellX >= 0 && cellX < 10 && cellY >= 0 && cellY < 20) {
            shapeCells.push({ x: cellX, y: cellY });
          }
        }
      }
    }

    // Update the grid with the new shape
    const updatedGrid = addShapeToGrid(grid, shape, shapeMatrix, gridX, gridY);
    setGrid(updatedGrid);

    // Update the shape with new position, cells, and landed state
    setShapes(prevShapes => 
      prevShapes.map(s => {
        if (s.id === id) {
          return {
            ...s,
            position: { ...s.position, x, y },
            hasLanded: true,
            cells: shapeCells
          };
        }
        return s;
      })
    );
  };
  

  useEffect (() => {
    if (shapes.some(shape => shape.hasLanded)) {
      const completedRows = checkCompletedRows(grid);
      if (completedRows.length > 0) {
        handleCompletedRows(completedRows);
      } else {
        // Only spawn a new shape if we don't already have an active (non-landed) shape
        const hasActiveShape = shapes.some(shape => !shape.hasLanded);
        
        // Add some delay before spawning new shape
        if (!hasActiveShape ) {
          setTimeout(() => {
            spawnNewShape();
          }, 500);
          return; // Exit early to avoid double spawn
        }
      } 
    }  
  }, [shapes, grid])
    
  const handleCompletedRows = async (completedRows: number[]) => {
    if (completedRows.length === 0) return;
  
    // Update score once
    setScore(prevScore => prevScore + completedRows.length * 10);
  
    try {
      // Process rows from bottom to top
      for (const completedRow of completedRows.sort((a, b) => b - a)) {
        // Update shapes for this row
        const updatedShapes = updateShapesForRow(completedRow, grid, shapes);
        
        // Update grid for this row
        const updatedGrid = updateGridForRow(completedRow, grid, updatedShapes);
    
        // Move shapes down
        const { shapes: movedShapes, grid: movedGrid } = moveShapesDown(
          completedRow, 
          updatedShapes, 
          updatedGrid
        );
    
        // Update state and wait for it to complete
        await new Promise<void>(resolve => {
          setShapes(movedShapes);
          setGrid(movedGrid);
          // Use setTimeout to ensure state updates are processed
          setTimeout(resolve, 100); // Small delay between row updates
        });
      }

    } catch (error) {
      console.error("Error processing completed rows:", error);
    }
  };


  const addShapeToGrid = (
    currentGrid: GridCell[][], 
    shape: ShapeState, 
    shapeMatrix: string[], 
    gridX: number, 
    gridY: number
  ): GridCell[][] => {

    const newGrid = [...currentGrid.map(row => [...row])];
    
    for (let row = 0; row < shapeMatrix.length; row++) {
      for (let col = 0; col < shapeMatrix[row].length; col++) {
        if (shapeMatrix[row][col] === '#') {
          const newX = gridX + col ;
          const newY = gridY - row + shapeMatrix.length;
          // console.log(newX, newY);
          if (newX >= 0 && newX < 10 && newY >= 0 && newY <= (20+shapeMatrix.length)) {
            if (newY <= 20) {
              newGrid[newY][newX] = { occupied: true, shapeId: shape.id };
            }
          } 
        }
      }
    }  

    return newGrid;
  };
  

  const updateShapesForRow = (
    completedRow: number, 
    currentGrid: GridCell[][], 
    currentShapes: ShapeState[]
  ): ShapeState[] => {
    // Update shapes that have blocks in completed rows
    return currentShapes.map(shape => {
      if (!shape.hasLanded) return shape;
      
      // Check if this shape has any cells in the completed row
      const hasBlocksInCompletedRow = shape.cells?.some(cell => (cell.y) === completedRow);
      if (!hasBlocksInCompletedRow) return shape;  
      
      // Get the shape matrix, considering custom matrices
      const matrix = shape.type === 'custom' && shape.customMatrix 
        ? shape.customMatrix 
        : getShapeMatrix(shape.type, shape.rotation);
      

      // Get the grid position of the shape
      const [gridX, gridY] = worldToGrid(shape.position.x, shape.position.y);
      
      // Creating matrix with removed blocks
      let newMatrix = [...matrix];
      let modified = false;
      
      // Check each cell in the shape matrix
      for (let row = (matrix.length - 1); row >= 0; row--) {
        const gridRowPosition = (gridY+1) - (matrix.length - 1 - row);
        
        // If this row of the shape coincides with a completed row
        if (gridRowPosition === (completedRow)) {
          // Convert the matrix row to array, remove the blocks, and convert back
          let matrixRow = newMatrix[row].split('');
          for (let col = 0; col < matrixRow.length; col++) {
            const gridColPosition = gridX + col;
            // Check if this position is part of the completed row
            if (gridColPosition >= 0 && 
                gridColPosition < 10 && 
                grid[completedRow][gridColPosition].shapeId === shape.id) {
              matrixRow[col] = ' ';
              modified = true;
            }
          }
          newMatrix[row] = matrixRow.join('');
        }
      }

      if (!modified) return shape;
      
      // Remove empty rows from the top and bottom of the matrix
      while (newMatrix.length > 0 && newMatrix[0].trim() === '') {
        newMatrix.shift();
      }

      while (newMatrix.length > 0 && newMatrix[newMatrix.length - 1].trim() === '') {
        newMatrix.pop();
      }
  
      // If the entire shape was cleared, mark it for removal
      if (newMatrix.length === 0) {
        return { ...shape, removed: true };
      }
  
      // Update cells array to remove cleared blocks
      const updatedCells = shape.cells?.filter(cell => (cell.y) !== completedRow) || [];

      // Return shape with updated matrix and cells, but same position
      return {
        ...shape,
        type: 'custom' as ShapeType,
        customMatrix: newMatrix,
        position: { 
          ...shape.position,
          y: shape.position.y + 0.25
        },
        cells: updatedCells,
      };
    }).filter(shape => !shape.removed);
  };


  // Pure function to update grid for a completed row
  const updateGridForRow = (
    completedRow: number, 
    currentGrid: GridCell[][], 
    shapes: ShapeState[]
  ): GridCell[][] => {
    const newGrid = [...currentGrid.map(row => [...row])];
    
    // Remove completed row
    newGrid.splice(completedRow, 1);
    
    // Add new empty row at top
    newGrid.unshift(Array(10).fill({ occupied: false, shapeId: null }));
  
    return newGrid;
  };

  // Function to handle falling motion
  const moveShapesDown = (
    completedRow: number,
    shapes: ShapeState[],
    currentGrid: GridCell[][]
  ): { shapes: ShapeState[], grid: GridCell[][] } => {
    const newGrid = [...currentGrid.map(row => [...row])];
    
    // First clear all cells above the completed row
    for (let row = completedRow + 1; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        newGrid[row][col] = { occupied: false, shapeId: null };
      }
    }
  
    // Update shapes and fill new grid positions
    const updatedShapes = shapes.map(shape => {
      if (!shape.hasLanded) return shape;
  
      // Check if ALL cells of this shape are above the completed row
      const allCellsAbove = shape.cells?.every(cell => cell.y > completedRow);
      const anyCellsAbove = shape.cells?.some(cell => cell.y > completedRow);
      
      if (!anyCellsAbove) {
        // If shape is entirely below or at completed row, just update its grid positions
        shape.cells?.forEach(cell => {
          if (cell.x >= 0 && cell.x < 10 && cell.y >= 0 && cell.y < 20) {
            newGrid[cell.y][cell.x] = { occupied: true, shapeId: shape.id };
          }
        });
        return shape;
      }
      
      if (allCellsAbove) {
        // If shape is entirely above completed row, move it down
        const updatedCells = shape.cells?.map(cell => ({
          x: cell.x,
          y: cell.y - 1
        }));
  
        const updatedShape = {
          ...shape,
          position: {
            ...shape.position,
            y: shape.position.y - 0.25
          },
          cells: updatedCells
        };
  
        // Fill new grid positions
        updatedShape.cells?.forEach(cell => {
          if (cell.x >= 0 && cell.x < 10 && cell.y >= 0 && cell.y < 20) {
            newGrid[cell.y][cell.x] = { occupied: true, shapeId: shape.id };
          }
        });
  
        return updatedShape;
      }
      
      // If shape has some cells above and some at/below completed row,
      // don't move it, just update grid positions
      shape.cells?.forEach(cell => {
        if (cell.x >= 0 && cell.x < 10 && cell.y >= 0 && cell.y < 20) {
          newGrid[cell.y][cell.x] = { occupied: true, shapeId: shape.id };
        }
      });
      
      return shape;
    });
  
    return { shapes: updatedShapes, grid: newGrid };
  };

  const handleUpdatePosition = (id: number, x: number, y: number, callback?: () => void) => {
    // Keep track of the target position

    setShapes(prevShapes => {
      const shape = prevShapes.find(shape => shape.id === id);
      
      if (!shape || shape.hasLanded) return prevShapes;
            
      const updatedShapes = prevShapes.map(shape => {
        if (shape.id === id) {
          return {
            ...shape,
            position: {
              ...shape.position,
              x: x,
              y: y
            }
          };
        }
        return shape;
      });      
      return updatedShapes;
    });
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

        let newX = shape.position.x; // => 0.75
        const rightBoundary = 1.0 - ((shapeMaxWidth - 1) * 0.25); // => 0.25
  
        // If rotation would cause out of bounds, adjust position if possible
        if (newX > rightBoundary) {
          while(newX > rightBoundary && newX >= -1.25) {
            newX -= 0.25;

            if(isValidPosition(shape.type, newX, shape.position.y, newRotation)) {
              return {
                ...shape,
                rotation: newRotation,
                shapeMaxWidth: shapeMaxWidth,
                position: {
                  ...shape.position,
                  x: newX
                }
              };
            }
          }
          return shape;
        }
        

        // Check if the rotation is valid in current position
        if (isValidPosition(shape.type, newX, shape.position.y, newRotation)) {
          return {
            ...shape,
            rotation: newRotation,
            shapeMaxWidth: shapeMaxWidth
          };
        }
        return shape;

      }

      return shape;

    }));
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scaleFactor = isMobile ? 0.7  : 1.0;
 

  useEffect(() => {
    // Focus the canvas when the component mounts
    if (canvasRef.current) {
      canvasRef.current.focus();
    }

    // Handle window resize for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Score system
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isGameOver) {
       
        setScore(prevScore => prevScore + 1);
      };
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, score]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = useCallback(() => {
    const deltaX = touchEndX.current - touchStartX.current;
    const activeShape = shapes.find(shape => !shape.hasLanded);
  
    if (Math.abs(deltaX) > 10 && activeShape) {
      const targetX = deltaX > 0
        ? Math.min(1.0 - ((activeShape.shapeMaxWidth - 1) * 0.25), activeShape.position.x + 0.25)
        : Math.max(-1.25, activeShape.position.x - 0.25);
  
      const animate = () => {
        requestAnimationFrame(() => {
          handleUpdatePosition(activeShape.id, targetX, activeShape.position.y);
        });
      };
  
      animate();
    }
  }, [shapes, handleUpdatePosition]);
  
  
  
  // Add a double tap handler for rotation
  const handleDoubleTap = () => {
    const activeShape = shapes.find(shape => !shape.hasLanded);
    if (activeShape) {
      handleRotate();
    }
  };

  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>
        Score: {score}
      </div>
      {isGameOver ? (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '1.5em',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '10px',
        width: '80%',
        maxWidth: '400px'
      }}>
        <h2 style={{ color: 'red', textAlign: 'center', marginTop: 0 }}>Game Over</h2>
        <p style={{ textAlign: 'center' }}>Your Score: {score}</p>
        
        {highScores && highScores.length > 0 ? (
          <div>
            <h3 style={{ textAlign: 'center' }}>High Scores</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Rank</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {highScores.map((user, index) => (
                  <tr key={index}>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{user.rank}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{user.name}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{user.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>Loading high scores...</p>
        )}
        
        <button 
          onClick={() => window.location.reload()} 
          style={{
            display: 'block',
            margin: '20px auto 0',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Play Again
        </button>
      </div>
    ) : (
        <Canvas shadows
          ref={canvasRef}
          tabIndex={0}
          style={{ 
            outline: 'none', 
            touchAction: 'none',
            width: '100%',
            height: '100%',
            userSelect: 'none'
          }}
          orthographic
          camera={{
            position: [0, 0, 10],
            fov: 90,
            near: 0,
            far: 1000,
            zoom: 200
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleTap}
        >
          <TetrisLights />
          <group scale={[scaleFactor, scaleFactor, 1]}>
            <Tetris />
            {shapes.map((shape, index) => (
              <ShapeMovement
                key={shape.id + index}
                shapeState={shape}
                onUpdatePosition={handleUpdatePosition}
                updateAndLandShape={updateAndLandShape}
                onRotate={handleRotate}
                isGameOver={isGameOver}
                isValidPosition={isValidPosition}
              />
            ))}
          </group>        
        </Canvas>
      )}

    </>
  )
}

export default App
