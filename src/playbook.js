// src/playbook.js

export const DEFAULT_PLAYS = [
    {
        id: 'play_1',
        name: 'HB Dive Right',
        category: 'offense_run',
        formation: 'singleback',
        assignments: {
            "1": { routeId: 'qbDropback', delay: 0 },
            "2": { routeId: 'slantRight', delay: 0 }
        },
        ballTransfers: [
            { time: 0, fromIndex: 0, toIndex: 1, flightDuration: 100 }, // Snap to QB
            { time: 1000, fromIndex: 1, toIndex: 2, flightDuration: 50 } // Quick handoff to RB
        ]
    },
    {
        id: 'play_2',
        name: 'Quick Out Right',
        category: 'offense_pass',
        formation: 'spread',
        assignments: {
            "1": { routeId: 'qbDropback', delay: 0 },
            "6": { routeId: 'outRight', delay: 0 }
        },
        ballTransfers: [
            { time: 0, fromIndex: 0, toIndex: 1, flightDuration: 150 }, // Snap to QB
            { time: 1500, fromIndex: 1, toIndex: 6, flightDuration: 500 } // Pass to WR
        ]
    },
    {
        id: 'play_3',
        name: 'HB Sweep Left',
        category: 'offense_run',
        formation: 'singleback',
        assignments: {
            "1": { routeId: 'qbDropback', delay: 0 },
            "2": { routeId: 'outLeft', delay: 0 }, // RB sweeps to the outside
            "5": { routeId: 'fly', delay: 0 }      // WR runs a decoy fly
        },
        ballTransfers: [
            { time: 0, fromIndex: 0, toIndex: 1, flightDuration: 100 }, // Snap to QB
            { time: 800, fromIndex: 1, toIndex: 2, flightDuration: 50 } // Handoff as RB crosses QB
        ]
    }
];

export function getPlaybook() {
    const data = JSON.parse(localStorage.getItem('flag_football_data')) || {};
    const customPlays = data.plays || [];
    return [...DEFAULT_PLAYS, ...customPlays];
}

export function savePlayToPlaybook(playObject) {
    const data = JSON.parse(localStorage.getItem('flag_football_data')) || {};
    if (!data.plays) data.plays = [];
    
    data.plays.push(playObject);
    localStorage.setItem('flag_football_data', JSON.stringify(data));
}