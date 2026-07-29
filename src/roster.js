// src/roster.js
import { loadRoster, saveRoster } from './storage.js';

// Helper function to generate a unique ID for each player
function generateId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

export function getTeam() {
    return loadRoster();
}

export function addPlayer(name, jerseyNumber) {
    const roster = loadRoster();
    
    const newPlayer = {
        id: generateId(),
        name: name,
        number: parseInt(jerseyNumber, 10)
    };
    
    roster.push(newPlayer);
    saveRoster(roster);
    
    return newPlayer; // Return it so the UI can update immediately
}

export function removePlayer(playerId) {
    let roster = loadRoster();
    // Keep everyone EXCEPT the player with the matching ID
    roster = roster.filter(player => player.id !== playerId);
    saveRoster(roster);
}