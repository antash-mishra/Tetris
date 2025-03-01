import { Object3D } from "three";

export const Figures: Record<string, Array<string>> = {
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

export type TFigureType = keyof typeof Figures;

export type TFigure = {
    type: TFigureType
    width: number
    height: number
    object: Object3D
}