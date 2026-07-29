// src/app.js

import { getTeam, addPlayer, removePlayer } from './roster.js';
import { exportAppState, importAppState } from './storage.js';
import { 
    initField, 
    resizeField, 
    runPlayAnimation, 
    setLongPressHandler, 
    assignRouteToPlayer, 
    handlePlayerDrop, 
    getAssignedPlayerIds, 
    resetPlay, 
    seekTimeline, 
    setPlayerDelay, 
    toggleTelestrator, 
    clearTelestrator, 
    enableCustomDrawing, 
    changeFormation 
} from './field.js';
import { getAllRoutes } from './routes.js';
import { loadPlayToField } from './field.js';
import { getPlaybook, savePlayToPlaybook } from './playbook.js';
document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Elements ---
    const btnRoster = document.getElementById('btn-roster');
    const btnCloseRoster = document.getElementById('btn-close-roster');
    const rosterPanel = document.getElementById('roster-panel');
    
    const btnSettings = document.getElementById('btn-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsModal = document.getElementById('settings-modal');
    
    const btnAddPlayer = document.getElementById('btn-add-player');
    const inputPlayerName = document.getElementById('new-player-name');
    const inputPlayerNumber = document.getElementById('new-player-number');
    const rosterList = document.getElementById('roster-list');

    const btnExport = document.getElementById('btn-export');
    const fileImport = document.getElementById('file-import');

    const routeMenu = document.getElementById('route-menu');
    let activePlayerNodeId = null;

    // --- Coaching Tools (Telestrator) ---
    const btnTelestrator = document.getElementById('btn-telestrator');
    const btnClearInk = document.getElementById('btn-clear-ink');

    btnTelestrator.addEventListener('click', () => {
        const isActive = toggleTelestrator();
        if (isActive) {
            btnTelestrator.style.background = '#d69e2e'; 
            btnTelestrator.innerText = '🖍️ DRAWING...';
        } else {
            btnTelestrator.style.background = '#ecc94b'; 
            btnTelestrator.innerText = '🖍️ INK';
        }
    });

    btnClearInk.addEventListener('click', () => {
        clearTelestrator();
    });

    // --- Animation Playback Logic ---
    const btnPlay = document.getElementById('btn-play');
    const btnReset = document.getElementById('btn-reset'); 
    const speedSlider = document.getElementById('speed-slider');
    const timelineSlider = document.getElementById('timeline-slider');

    btnPlay.addEventListener('click', () => {
        const speed = parseFloat(speedSlider.value);
        runPlayAnimation(speed, (progress) => {
            timelineSlider.value = progress;
        });
    });

    timelineSlider.addEventListener('input', (e) => {
        seekTimeline(e.target.value);
    });

    btnReset.addEventListener('click', () => {
        resetPlay();
        timelineSlider.value = 0; 
    });

	// --- Playbook Logic ---
    const playbookSelector = document.getElementById('playbook-selector');
    
    function renderPlaybook() {
        playbookSelector.innerHTML = '<option value="">-- Select Play --</option>';
        const playbook = getPlaybook();
        
        playbook.forEach(play => {
            const opt = document.createElement('option');
            opt.value = play.id;
            opt.innerText = play.name;
            playbookSelector.appendChild(opt);
        });
    }

    playbookSelector.addEventListener('change', (e) => {
        const playId = e.target.value;
        if (!playId) return;
        
        const play = getPlaybook().find(p => p.id === playId);
        if (play) {
            loadPlayToField(play);
        }
    });

    // Save Play Placeholder
    document.getElementById('btn-save-play').addEventListener('click', () => {
        alert("The visual route saving logic will be mapped to this button next!");
    });
    
    // Call this at the bottom of your file next to renderRoster()
    renderPlaybook();

    // --- UI Toggles ---
    btnRoster.addEventListener('click', () => {
        rosterPanel.classList.add('open');
        document.body.classList.add('roster-open');
        setTimeout(resizeField, 300); 
    });

    btnCloseRoster.addEventListener('click', () => {
        rosterPanel.classList.remove('open');
		document.body.classList.remove('roster-open');
        setTimeout(resizeField, 300);
    });

    btnSettings.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });

    btnCloseSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

	// --- Formation Selector ---
    const formationSelector = document.getElementById('formation-selector');
    if (formationSelector) {
        formationSelector.addEventListener('change', (e) => {
            changeFormation(e.target.value);
        });
    }

    // --- Drag and Drop Logic ---
    const canvasContainer = document.getElementById('canvas-container');

    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); 
    });

    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        
        const playerId = e.dataTransfer.getData('text/plain');
        if (!playerId) return;

        const team = getTeam();
        const playerInfo = team.find(p => p.id === playerId);
        if (!playerInfo) return;

        const rect = canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        handlePlayerDrop(x, y, playerInfo, updateRosterHighlights);
    });

    function updateRosterHighlights() {
        const assignedIds = getAssignedPlayerIds();
        const rosterItems = document.querySelectorAll('.roster-item');
        
        rosterItems.forEach(item => {
            if (assignedIds.includes(item.dataset.id)) {
                item.classList.add('on-field');
            } else {
                item.classList.remove('on-field');
            }
        });
    }

    // --- Route Menu Logic ---
    setLongPressHandler((nodeId, x, y) => {
        activePlayerNodeId = nodeId;
        routeMenu.innerHTML = '';
        
        const routes = getAllRoutes();
        routes.forEach(route => {
            const opt = document.createElement('div');
            opt.className = 'route-option';
            
            opt.innerHTML = `
                <svg viewBox="-50 -100 100 120" stroke="#2b6cb0" stroke-width="6" fill="transparent" stroke-linecap="round" stroke-linejoin="round">
                    <path d="${route.pathData}" />
                </svg>
                <span class="route-label">${route.name}</span>
            `;
            
            opt.addEventListener('click', () => {
                assignRouteToPlayer(activePlayerNodeId, route.pathData, { duration: route.duration, delay: route.delay });
                routeMenu.classList.remove('active');
            });
            
            routeMenu.appendChild(opt);
        });

        // Add a "Set Delay" Option to the menu
        const delayOpt = document.createElement('div');
        delayOpt.className = 'route-option';
        delayOpt.innerHTML = `
            <svg viewBox="0 0 40 40" stroke="#48bb78" stroke-width="4" fill="transparent" stroke-linecap="round">
                <circle cx="20" cy="20" r="15"></circle>
                <path d="M 20 10 L 20 20 L 28 20"></path>
            </svg>
            <span class="route-label">Delay</span>
        `;
        
        delayOpt.addEventListener('click', () => {
            const delaySec = prompt("Wait how many seconds before running? (e.g., 1.5)", "0");
            if (delaySec !== null) {
                const delayMs = parseFloat(delaySec) * 1000; 
                if (!isNaN(delayMs)) {
                    setPlayerDelay(activePlayerNodeId, delayMs);
                }
            }
            routeMenu.classList.remove('active');
        });
        
        routeMenu.appendChild(delayOpt);

        // Add the "Custom Draw" option
        const customOpt = document.createElement('div');
        customOpt.className = 'route-option';
        customOpt.innerHTML = `
            <svg viewBox="0 0 40 40" stroke="#ed8936" stroke-width="4" fill="transparent" stroke-linecap="round" stroke-dasharray="4,4">
                <path d="M 5 35 Q 15 5, 35 5" />
            </svg>
            <span class="route-label">Draw</span>
        `;
        customOpt.addEventListener('click', () => {
            enableCustomDrawing(activePlayerNodeId);
            routeMenu.classList.remove('active');
        });
        routeMenu.appendChild(customOpt);

        routeMenu.style.left = (x + 20) + 'px';
        routeMenu.style.top = (y - 180) + 'px';
        routeMenu.classList.add('active');
    });

    document.addEventListener('mousedown', (e) => {
        if (!routeMenu.contains(e.target) && routeMenu.classList.contains('active')) {
            routeMenu.classList.remove('active');
        }
    });

    document.addEventListener('touchstart', (e) => {
        if (!routeMenu.contains(e.target) && routeMenu.classList.contains('active')) {
            routeMenu.classList.remove('active');
        }
    });

    // --- Roster Logic ---
    function renderRoster() {
        rosterList.innerHTML = '';
        const team = getTeam();
        
        team.forEach(player => {
            const li = document.createElement('li');
            li.className = 'roster-item';
            li.draggable = true;
            li.dataset.id = player.id;
            
            li.innerHTML = `
                <strong style="width: 40px;">#${player.number}</strong>
                <span>${player.name}</span> 
                <span class="delete-btn" style="margin-left:auto; cursor:pointer; color:#e53e3e; font-weight:bold;">X</span>
            `;
            
            li.querySelector('.delete-btn').addEventListener('click', () => {
                removePlayer(player.id);
                renderRoster();
            });
            
            li.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', player.id);
            });

            rosterList.appendChild(li);
        });

        updateRosterHighlights();
    }

    btnAddPlayer.addEventListener('click', () => {
        const name = inputPlayerName.value.trim();
        const number = inputPlayerNumber.value.trim();
        
        if (name && number) {
            addPlayer(name, number);
            inputPlayerName.value = '';
            inputPlayerNumber.value = '';
            renderRoster();
        } else {
            alert("Please enter both a name and a jersey number.");
        }
    });

    // --- Backup & Restore Logic ---
    btnExport.addEventListener('click', () => {
        exportAppState();
    });

    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        importAppState(file, (success, message) => {
            alert(message);
            if (success) {
                renderRoster();
                settingsModal.classList.remove('active');
            }
        });
        e.target.value = ''; 
    });

    // --- Initialization ---
    initField('canvas-container');
    renderRoster();
});