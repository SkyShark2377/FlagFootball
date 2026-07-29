// src/routes.js

export const PRESET_ROUTES = {
    qbDropback: {
        id: 'qbDropback',
        name: 'QB Drop',
        pathData: 'M 0 0 l 0 30',
        duration: 1000, 
        delay: 0
    },
    fly: {
        id: 'fly',
        name: 'Fly',
        pathData: 'M 0 0 l 0 -80',
        duration: 2000, 
        delay: 0        
    },
    slantRight: {
        id: 'slantRight',
        name: 'Slant (R)',
        pathData: 'M 0 0 l 0 -40 l 40 -40',
        duration: 2500, 
        delay: 0
    },
    slantLeft: {
        id: 'slantLeft',
        name: 'Slant (L)',
        pathData: 'M 0 0 l 0 -40 l -40 -40',
        duration: 2500,
        delay: 0
    },
    outRight: {
        id: 'outRight',
        name: 'Out (R)',
        pathData: 'M 0 0 l 0 -40 l 40 0',
        duration: 2500,
        delay: 300      
    },
    outLeft: {
        id: 'outLeft',
        name: 'Out (L)',
        pathData: 'M 0 0 l 0 -40 l -40 0',
        duration: 2500,
        delay: 300
    },
    curl: {
        id: 'curl',
        name: 'Curl',
        pathData: 'M 0 0 l 0 -60 c 15 0, 15 20, 0 20',
        duration: 3000, 
        delay: 0 
    }
};

export function getAllRoutes() {
    return Object.values(PRESET_ROUTES);
}

export function getRouteData(routeId) {
    return PRESET_ROUTES[routeId] ? PRESET_ROUTES[routeId].pathData : null;
}