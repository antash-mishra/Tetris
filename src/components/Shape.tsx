import React, { Component } from 'react'

const shape = [
  '#',
  '#',
  '#',
  '#',
]

export class Shape extends Component {
  
  render() {
    let max_length = 0;
    shape.forEach(row => {
      let row_length = row.split('').length;
      if (row_length > max_length) {
        max_length = row_length;
      }
    })
    // console.log("Max Length: ", max_length);
    return (
      <group position={[-1.25, -2.5, 0]}>
        {shape.map((row, indexX) => 
        
          row.split('').map((cell, indexY) => {
            if (cell === '#') {

              return (
                <mesh key={indexY+indexX} position={[(indexY*0.25)+(0.24/2), ((shape.length - indexX)*0.25)+(0.24/2), 1]}>
                  <planeGeometry args={[0.24, 0.24, 32, 32]} />
                  <meshBasicMaterial color="red" />
                </mesh>
              )
            }
            return (
              <mesh key={indexY+indexX} position={[indexY*0.25, (shape.length - indexX)*0.225, 1]}>
                <planeGeometry args={[0.24, 0.215, 32, 32]} />
                <meshBasicMaterial color="black" opacity={0.0} transparent />
              </mesh>
            )
          })
        )}
      </group>
    )
  }
}

export default Shape