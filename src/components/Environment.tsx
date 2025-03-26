import { useLoader } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";


const EnvironmentMap: React.FC = () => {
    const envMap = useLoader(RGBELoader, "/pine_attic_4k.hdr");

    return (
        <group>
            {/* Environment Map for reflections & background */}
            <Environment background map={envMap} />

            {/* Reflective Sphere */}
            
        </group>
    );

};

export default EnvironmentMap;