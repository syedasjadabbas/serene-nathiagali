// Mutable state shared between DOM scroll handlers and WebGL frame loops.
// No three.js imports here, so sections can update it before the 3D engine has loaded.

// progress: where the scroll is (0–1). shown: what the map plays, paced in MapScene.
// drawn: the 3D map has rendered, so the still that stands in for it can go.
export const mapState = { progress: 0, shown: 0, drawn: false, pointerX: 0, pointerY: 0 }

export const galleryState = { progress: 0, velocity: 0 }
