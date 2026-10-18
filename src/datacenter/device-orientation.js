// Physical manufacturer face names remain intact. Only mounting orientation changes.
const rearInterfaceDevices=new Set(['cisco-c1121-8pltep','cisco-1941','cisco-2911-k9','cisco-3925e','cisco-3945e','cisco-isr-4331','cisco-isr-4431']);
export function interfaceSide(model){return model.interfaceSide|| (rearInterfaceDevices.has(model.id)?'rear':'front');}
export function rackRotation(model){return interfaceSide(model)==='rear'?Math.PI:0;}
export function rackDisplayModel(model){const side=interfaceSide(model);return model.interfaceImage?{...model,images:{...model.images,[side]:model.interfaceImage}}:model;}
