// Presentation offsets only. Walking/navigation in each map retain local coordinates.
export const HOME_CAPITAL_OFFSET={x:232,y:0,z:-4};
export const HOME_WORLD_BOUNDS={minX:-40,maxX:412,minZ:-184,maxZ:176,minY:-3,maxY:55};
export const homeWorldPoint=(area,x,z)=>area==='capital'?{x:x+HOME_CAPITAL_OFFSET.x,z:z+HOME_CAPITAL_OFFSET.z}:{x,z};
