import React, { Component } from 'react'


export class Tetris extends Component {

	render() {
  	const num_row_points: number = 9;
		const num_col_points: number = 19;
		return (
			<>
				<mesh position={[0, 0, 0]}>
					<planeGeometry args={[2.5, 5.0, 64, 64]} />
					<meshBasicMaterial color="black" opacity={0.5} transparent />
				</mesh>

				<group>
				{
					Array.from({length: num_row_points}, (_, i) => 
						Array.from({length: num_col_points}, (_, j) => {
							console.log(i, j, "pos: ", (-1.25 + ((i+1)*0.25)), -2.5 + ((j+1)*0.25))
							return (
								<mesh key={`${i}-${j}`} position={[(-1.25 + ((i+1)*0.25)), -2.5 + ((j+1)*0.25), 1]}>
									<sphereGeometry args={[0.015, 32, 32]} />
									<meshBasicMaterial color="black" opacity={0.5} />
								</mesh>
							)
						})
					)
				}
				</group>
			</>
		)
	}
}

export default Tetris