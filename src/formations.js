// src/formations.js
import { getCustomFormations } from './storage.js';

export function getFormationCoordinates(formationType, width, height) {
    const totalVisibleYards = 25; 
    const yardHeight = height / totalVisibleYards;
    const losY = height - (10 * yardHeight); 
    const centerX = width / 2;
    const padding = width * 0.1;
    const fieldWidth = width - (padding * 2);

    const defaultFormations = {
        scrimmage: [
            { x: (width * 0.25) + (0 * (width * 0.5 / 6)), y: losY },
            { x: (width * 0.25) + (1 * (width * 0.5 / 6)), y: losY },
            { x: (width * 0.25) + (2 * (width * 0.5 / 6)), y: losY },
            { x: (width * 0.25) + (3 * (width * 0.5 / 6)), y: losY },
            { x: (width * 0.25) + (4 * (width * 0.5 / 6)), y: losY },
            { x: (width * 0.25) + (5 * (width * 0.5 / 6)), y: losY },
            { x: (width * 0.25) + (6 * (width * 0.5 / 6)), y: losY },
        ],
        singleback: [
            { x: centerX, y: losY }, 
            { x: centerX, y: losY + (2 * yardHeight) }, 
            { x: centerX, y: losY + (5 * yardHeight) }, 
            { x: centerX - (fieldWidth * 0.15), y: losY }, 
            { x: centerX + (fieldWidth * 0.15), y: losY }, 
            { x: padding + (fieldWidth * 0.1), y: losY }, 
            { x: padding + (fieldWidth * 0.9), y: losY }  
        ],
        spread: [
            { x: centerX, y: losY }, 
            { x: centerX, y: losY + (3.5 * yardHeight) }, 
            { x: centerX + (fieldWidth * 0.15), y: losY + (3.5 * yardHeight) }, 
            { x: padding + (fieldWidth * 0.1), y: losY }, 
            { x: centerX - (fieldWidth * 0.25), y: losY }, 
            { x: centerX + (fieldWidth * 0.25), y: losY }, 
            { x: padding + (fieldWidth * 0.9), y: losY }  
        ],
        tripsRight: [
            { x: centerX, y: losY }, 
            { x: centerX, y: losY + (3.5 * yardHeight) }, 
            { x: centerX - (fieldWidth * 0.15), y: losY + (3.5 * yardHeight) }, 
            { x: padding + (fieldWidth * 0.1), y: losY }, 
            { x: centerX + (fieldWidth * 0.15), y: losY }, 
            { x: centerX + (fieldWidth * 0.35), y: losY }, 
            { x: padding + (fieldWidth * 0.9), y: losY }  
        ]
    };

    // Merge built-in formations with any custom saved ones from storage
    const custom = getCustomFormations();
    const allFormations = { ...defaultFormations };
    
    for (const [id, formObj] of Object.entries(custom)) {
        allFormations[id] = formObj.coordinates;
    }

    return allFormations[formationType] || defaultFormations.scrimmage;
}

export function getAllFormationsList() {
    const custom = getCustomFormations();
    const list = [
        { id: 'scrimmage', name: 'Line of Scrimmage' },
        { id: 'singleback', name: 'Singleback' },
        { id: 'spread', name: 'Spread (Shotgun)' },
        { id: 'tripsRight', name: 'Trips Right' }
    ];

    for (const [id, formObj] of Object.entries(custom)) {
        list.push({ id: id, name: formObj.name });
    }

    return list;
}