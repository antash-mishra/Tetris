import React, { Component } from 'react'

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
    const paddedMatrix = matrix.map(row => {
      while (row.length < cols) {
        row = row + ' ';
      }
      return row;
    });
  
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
    let current_shape = this.props.customMatrix || shape[this.props.shapeType];
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
                <mesh key={indexY+indexX} 
                  position={[
                    (indexY*0.25)+(0.24/2), 
                    ((current_shape.length - indexX)*0.25)+(0.24/2),
                    0.1
                  ]}
                >
                  <planeGeometry args={[0.23, 0.23, 32, 32]} />
                  <meshBasicMaterial color="red" />
                </mesh>
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

export default Shape