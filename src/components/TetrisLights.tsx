function TetrisLights() {
    return (
      <>
        {/* Main ambient light for base illumination */}
        <ambientLight intensity={0.6} />
        
        {/* Top-right key light */}
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8} 
          color="#fff"
        />
        
        {/* Bottom-left fill light */}
        <directionalLight 
          position={[-3, -2, 4]} 
          intensity={0.3} 
          color="#ffd"
        />
        
        {/* Back rim light for edge definition */}
        <directionalLight 
          position={[0, 0, -5]} 
          intensity={0.2} 
          color="#aaf"
        />
        
        {/* Optional point light for glow effect on hover */}
        <pointLight 
          position={[0, 0, 3]} 
          intensity={0.4} 
          color="#ff9"
          distance={5}
          decay={2}
        />
      </>
    );
  }

  export default TetrisLights;