import { Component, useEffect, useState } from 'react'
import { useSpring, animated } from '@react-spring/three';
import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

export type ShapeType = 'T' | 'L' | 'I' | 'O' | 'S' | 'Z' | 'J' | 'custom';

const shape = {
  'S' : [
    ' ##',
    '## '
  ],

  'Z' : [
    '##',
    ' ##'
  ],
  
  'L' : [
    '#',
    '#',
    '##'
  ],
  
  'J' : [
    ' #',
    ' #',
    '##'
  ],
  
  'O' : [
    '##',
    '##'  
  ],
  
  'T' : [
    ' #',
    '###'
  ],
  
  'I' : [
    '#',
    '#',
    '#',
    '#',
  ],
  
  '#' : [ // <-- temporary, just for testing
    '####',
    '####',
    '####',
    '####',
  ],   
}

export class Shape extends Component<{
  shapeType: ShapeType,
  rotation?: number,
  customMatrix?: string[]
}> {

  rotateShape(matrix: string[]): string[] {
    const rows = matrix.length;
    const cols = Math.max(...matrix.map(row => row.length));
    
    // Pad all rows to have equal length
    const paddedMatrix = matrix.map(row => row.padEnd(cols, ' '));
  
    // Create new array for rotated shape
    let rotated: string[] = [];
    
    // Rotate 90 degrees clockwise
    for (let col = 0; col < cols; col++) {
      let newRow = '';
      for (let row = rows - 1; row >= 0; row--) {
        newRow += paddedMatrix[row][col] || ' ';
      }
      rotated.push(newRow);
    }
  
    // Trim trailing spaces but preserve leading spaces
    return rotated.map(row => row.replace(/\s+$/, ''));
  }

  render() {
    let current_shape = this.props.customMatrix || shape[this.props.shapeType as keyof typeof shape]
    const rotations = (this.props.rotation || 0) % 4;

    // Apply rotations
    if (!this.props.customMatrix) {
      for (let i = 0; i < rotations; i++) {
        current_shape = this.rotateShape(current_shape);
      }
    }


    return (
      <group>
        {current_shape.map((row, indexX) => 
          
          row.split('').map((cell, indexY) => {
            
            if (cell === '#') {
              // console.log(((current_shape.length - indexX)*0.25)+(0.24/2))
              return (
                <TetrisBlock key={indexY+indexX} x={(indexY*0.25)+(0.24/2)} y={((current_shape.length - indexX)*0.25)+(0.24/2)} />
              )
            }
            return (
              null
            )
          })
        )} 
      </group>
    )
  }
}

function TetrisBlock({ x, y }: { x: number, y: number }) {
  const [prevPos, setPrevPos] = useState({ x, y });
  const { position } = useSpring({
    from: { position: [prevPos.x, prevPos.y, 0.1] },
    to: { position: [x, y, 0.1] },
    config: { mass: 0.5, tension: 180, friction: 24 }
  });
  const blockTexture = useLoader(TextureLoader, '/72164.jpg')
  blockTexture.colorSpace = THREE.SRGBColorSpace

  


  useEffect(() => {
    setPrevPos({ x, y });
  }, [x, y]);
  
  // Add hover effect
  const [hovered, setHovered] = useState(false);
  const { emissiveIntensity } = useSpring({
    emissiveIntensity: hovered ? 0.5 : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });
  
  return (
    <animated.mesh 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.25, 0.25, 0.05, 1, 1, 1]} />
      <animated.meshStandardMaterial
        color="#FF8E00"
        emissive="#FF8E00"
        emissiveIntensity={emissiveIntensity}
        roughness={0.3}
        metalness={0.2}      
      />
      
      {/* Top beveled edge for 3D effect */}
      <mesh position={[0, 0, 0.026]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshBasicMaterial 
          map={blockTexture}
        />
      </mesh>

    </animated.mesh>
  );
}



export default Shape