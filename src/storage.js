// src/storage.js
const STORAGE_KEY = 'flagFootballAppState';

// --- Internal Helpers ---
function getAppState() {
    const data = localStorage.getItem(STORAGE_KEY);
    // Initialize default structure if nothing exists yet
    return data ? JSON.parse(data) : { roster: [], playbook: [] };
}

function setAppState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --- Roster Management ---
export function loadRoster() {
    return getAppState().roster;
}

export function saveRoster(rosterArray) {
    const state = getAppState();
    state.roster = rosterArray;
    setAppState(state);
}

// --- Playbook Management ---
export function savePlay(playObject) {
    const state = getAppState();
    state.playbook.push(playObject);
    setAppState(state);
}

export function getPlaysByCategory(category) {
    const plays = getAppState().playbook;
    return plays.filter(play => play.category === category);
}

// --- Master Backup & Restore ---
export function exportAppState() {
    const state = getAppState();
    const dataStr = JSON.stringify(state, null, 2);
    
    // Create a Blob and trigger download
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flag-football-backup-${new Date().toISOString().slice(0,10)}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function importAppState(file, callback) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            const importedState = JSON.parse(event.target.result);
            // Basic validation to ensure it's our app's format
            if (importedState.roster && importedState.playbook) {
                setAppState(importedState);
                callback(true, "Data restored successfully.");
            } else {
                callback(false, "Invalid backup file format.");
            }
        } catch (e) {
            callback(false, "Error parsing the file. Make sure it is a valid JSON.");
        }
    };
    
    reader.readAsText(file);
}