import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useRef } from 'react';
import { useDrag, useGesture } from '@use-gesture/react';
import { useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';


const SwipePlane = ({
    shape,
    onUpdatePosition,
    onRotate
  }: {
    shape;
    onUpdatePosition: (id: number, x: number, y: number) => void;
    onRotate: () => void;
  }) => {
    const swipeRef = useRef<THREE.Mesh>(null);
    const { gl } = useThree();

    const clock = useRef<THREE.Clock>(new THREE.Clock());

    // Prevent multiple triggers during a single swipe
    const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);

    // Track the last processed time to prevent flickering
    const lastProcessedTime = useRef(0);

    // Initialize the clock
    useEffect(() => {
      clock.current.start();
      return () => {
        clock.current.stop();
      };
    }, []);

    // Use the drag gesture directly on the canvas
    useGesture({
      onDragStart: () => {
        setIsProcessingSwipe(false);
      },
  
      onDrag: ({ movement: [mx, my], direction: [dx, dy], velocity: [vx, vy], last }) => {
        if (!shape) return;
        
        // Calculate actual movement distance
        const movementDistance = Math.sqrt(mx * mx + my * my);
        
        // Use a proper threshold for minimum movement
        const MIN_SWIPE_DISTANCE = 30; // pixels

        // Add a velocity threshold to make it more responsive
        

        // Get elapsed time from THREE.Clock for consistent timing
        const currentTime = clock.current.getElapsedTime();
        const timeSinceLastSwipe = currentTime - lastProcessedTime.current;
        const MIN_TIME_BETWEEN_SWIPES = 0.25; // seconds
        

        console.log("dist: ", movementDistance, velocity);
        if (true) {
          // Determine primary direction based on which axis had the larger movement
          const absMovementX = Math.abs(mx);
          const absMovementY = Math.abs(my);
          
          let swipeDirection;
          
          if (absMovementX > absMovementY) {
            // Horizontal swipe
            swipeDirection = mx > 0 ? 'right' : 'left';
          } else {
            // Vertical swipe
            swipeDirection = my > 0 ? 'down' : 'up';
          }
          
          console.log("Swipe: ", swipeDirection, "Movement:", [mx, my], "Distance:", movementDistance);
          
          switch (swipeDirection) {
            case 'left':
              console.log("Left");
              onUpdatePosition(
                shape.id,
                Math.max(-1.25, shape.position.x - 0.25),
                shape.position.y
              );
              break;
               
            case 'right':
              console.log("Right");
              onUpdatePosition(
                shape.id,
                Math.min(1.0 - ((shape.shapeMaxWidth - 1) * 0.25), shape.position.x + 0.25),
                shape.position.y
              );
              break;
              
            case 'up':

              break;
              
            case 'down':
              // Original code doesn't do anything on down swipe
              break;
              
            default:
              break;
          }

          setIsProcessingSwipe(true);
          lastProcessedTime.current = currentTime;  
        }
        // Reset the processing flag when the drag ends
        if (last) {
          setIsProcessingSwipe(false);
        }
      }
    }, { 
      target: gl.domElement,
      eventOptions: { passive: false }
    });
    
    return (
      <animated.mesh ref={swipeRef} position={[1, 1, 1]} >
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial transparent opacity={0} color="hotpink" />
      </animated.mesh>
    );
  
  
  };
  
  export default SwipePlane;
  