import React, { Component, useRef, useEffect } from 'react'
import { useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from "three";


const Tetris: React.FC = () => {
    const num_row_points: number = 9; // 9 row grid points (between 10 rows)
    const num_col_points: number = 19; // 19 column grid points (between 20 cols)
    const CELL_SIZE = 0.25;
    const BOARD_WIDTH = 2.5;
    const BOARD_HEIGHT = 5.0;

    // Use useThree hook inside the functional component
    const { size } = useThree();
    const texture = useLoader(TextureLoader, "/is-he-friendly-655529.png");
    const isMobile = size.width < 768;	  
    
    // Scale factor for mobile
    const scaleFactor = isMobile ? 0.5 : 1.0;

	const gridRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

	useEffect(() => {
        if (!gridRef.current) return;
        let index = 0;

        for (let i = 0; i < num_row_points; i++) {
            for (let j = 0; j < num_col_points; j++) {
                const x = -(BOARD_WIDTH / 2) + (i + 1) * CELL_SIZE;
                const y = -(BOARD_HEIGHT / 2) + (j + 1) * CELL_SIZE;

                dummy.position.set(x, y, 0.1);
                dummy.updateMatrix();
                gridRef.current.setMatrixAt(index++, dummy.matrix);
            }
        }
        gridRef.current.instanceMatrix.needsUpdate = true;
    }, []);

    return (
        <>
			<group>
            	{/* Background Board */}
            	<mesh position={[0, 0, 0]}>
            	    <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
                    <meshBasicMaterial map={texture} />
                </mesh>

            	{/* Grid Points */}
				<instancedMesh ref={gridRef} args={[null, null, num_row_points * num_col_points]}>
				<octahedronGeometry args={[0.015, 0]} /> {/* Only 8 triangles per point */}
				<meshBasicMaterial color="black" opacity={0.5} />
            	</instancedMesh>

			</group>
        </>
    );
};

export default Tetris;
