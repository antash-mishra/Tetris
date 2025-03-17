import React, { Component, useRef } from 'react'
import { useThree } from '@react-three/fiber';


const Tetris: React.FC = () => {
    const num_row_points: number = 9; // 9 row grid points (between 10 rows)
    const num_col_points: number = 19; // 19 column grid points (between 20 cols)
    const CELL_SIZE = 0.25;
    const BOARD_WIDTH = 2.5;
    const BOARD_HEIGHT = 5.0;

    // Use useThree hook inside the functional component
    const { size } = useThree();
    const isMobile = size.width < 768;	  
    
    // Scale factor for mobile
    const scaleFactor = isMobile ? 0.5 : 1.0;

    return (
        <>
			<group>
            	{/* Background Board */}
            	<mesh position={[0, 0, 0]}>
            	    <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, 64, 64]} />
            	    <meshBasicMaterial color="black" opacity={0.5} transparent />
            	</mesh>

            	{/* Grid Points */}
            	<group>
            	    {Array.from({ length: num_row_points }, (_, i) =>
            	        Array.from({ length: num_col_points }, (_, j) => (
            	            <mesh
            	                key={`${i}-${j}`}
            	                position={[
            	                    -(BOARD_WIDTH / 2) + (i + 1) * CELL_SIZE, // Row lines
            	                    -(BOARD_HEIGHT / 2) + (j + 1) * CELL_SIZE, // Column lines
            	                    0.1
            	                ]}
            	            >
            	                <sphereGeometry args={[0.015, 32, 32]} />
            	                <meshBasicMaterial color="black" opacity={0.5} />
            	            </mesh>
            	        ))
            	    )}
            	</group>
			</group>
        </>
    );
};

export default Tetris;
