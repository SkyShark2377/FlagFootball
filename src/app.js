// src/app.js

import { getTeam, addPlayer, removePlayer } from './roster.js';
import { exportAppState, importAppState, saveCustomFormation } from './storage.js';
import { getAllFormationsList } from './formations.js';
import { getAllRoutes } from './routes.js';
import { getPlaybook, savePlayToPlaybook } from './playbook.js';
import { 
    initField, 
    resizeField, 
    runPlayAnimation, 
    setDoubleTapHandler, 
    assignRouteToPlayer, 
    handlePlayerDrop, 
    getAssignedPlayerIds, 
    resetPlay, 
    seekTimeline, 
    setPlayerDelay, 
    toggleTelestrator, 
    clearTelestrator, 
    enableCustomDrawing, 
    changeFormation,
    loadPlayToField,
    clearPlayRoutes,
    getCurrentPlayerCoordinates, 
    getCurrentPlayAssignments,
    addBallTransfer,
    getActiveBallTransfers
} from './field.js';

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

    // --- Animation Playback & Custom Timeline Logic ---
    const btnPlay = document.getElementById('btn-play');
    const btnReset = document.getElementById('btn-reset'); 
    const speedSlider = document.getElementById('speed-slider');
    
    // New Custom Timeline Elements
    const customTimeline = document.getElementById('custom-timeline');
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineHandle = document.getElementById('timeline-handle');
    let isScrubbing = false;

    // Helper to visually fill the green bar and slide the white dot
    function updateTimelineUI(percentage) {
        if(timelineProgress) timelineProgress.style.width = percentage + '%';
        if(timelineHandle) timelineHandle.style.left = percentage + '%';
    }

    if (btnPlay) {
        btnPlay.addEventListener('click', () => {
            const speed = parseFloat(speedSlider ? speedSlider.value : 1);
            runPlayAnimation(speed, (progress) => {
                updateTimelineUI(progress);
            });
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            resetPlay();
            updateTimelineUI(0); 
        });
    }

    // --- Custom Scrubber Drag Logic ---
    function handleScrub(e) {
        if (!isScrubbing || !customTimeline) return;
        const rect = customTimeline.getBoundingClientRect();
        
        // Handle both mouse and touch coordinates seamlessly
        let clientX = e.clientX;
        if (clientX === undefined && e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        }
        if (clientX === undefined) return;

        // Calculate where the finger/mouse is relative to the track's width
        let x = clientX - rect.left;
        let percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

        updateTimelineUI(percentage);
        seekTimeline(percentage);
    }

    if (customTimeline) {
        // Start scrubbing on click/touch
        customTimeline.addEventListener('mousedown', (e) => {
            isScrubbing = true;
            handleScrub(e);
        });
        customTimeline.addEventListener('touchstart', (e) => {
            isScrubbing = true;
            handleScrub(e);
        });
    }

    // Listen globally for movement so the handle doesn't get "stuck" if the mouse leaves the track
    document.addEventListener('mousemove', handleScrub);
    document.addEventListener('mouseup', () => { isScrubbing = false; });
    document.addEventListener('touchmove', handleScrub);
    document.addEventListener('touchend', () => { isScrubbing = false; });

    // --- Formation & Playbook UI Rendering ---
    const formationSelector = document.getElementById('formation-selector');
    const playbookSelector = document.getElementById('playbook-selector');

    function renderFormations() {
        if (!formationSelector) return;
        const currentVal = formationSelector.value;
        formationSelector.innerHTML = '';
        
        const formations = getAllFormationsList();
        formations.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.innerText = f.name;
            formationSelector.appendChild(opt);
        });
        if (currentVal) formationSelector.value = currentVal;
    }

    function renderPlaybook() {
        if (!playbookSelector) return;
        const currentVal = playbookSelector.value;
        playbookSelector.innerHTML = '<option value="">-- Select Play --</option>';
        
        const playbook = getPlaybook();
        playbook.forEach(play => {
            const opt = document.createElement('option');
            opt.value = play.id;
            opt.innerText = play.name;
            playbookSelector.appendChild(opt);
        });
        
        // Force browser redraw of the select element to fix scrollbar bug
        playbookSelector.style.display = 'none';
        playbookSelector.offsetHeight; 
        playbookSelector.style.display = '';
        
        if (currentVal) playbookSelector.value = currentVal;
    }

    // --- Formation Selector Change Listener ---
    if (formationSelector) {
        formationSelector.addEventListener('change', (e) => {
            changeFormation(e.target.value);
        });
    }

    // --- Playbook Selector Change Listener ---
    if (playbookSelector) {
        playbookSelector.addEventListener('change', (e) => {
            const playId = e.target.value;
            if (!playId) return;
            
            const play = getPlaybook().find(p => p.id === playId);
            if (play) {
                if (formationSelector) {
                    formationSelector.value = play.formation;
                }
                loadPlayToField(play);
            }
        });
    }

    // --- Save Custom Formation Button ---
    const btnSaveFormation = document.getElementById('btn-save-formation');
    if (btnSaveFormation) {
        btnSaveFormation.addEventListener('click', () => {
            const name = prompt("Enter a name for this new formation (e.g., 'Goal Line'):");
            if (!name) return;
            
            const id = 'form_' + Date.now();
            const coords = getCurrentPlayerCoordinates();
            
            saveCustomFormation(id, name, coords);
            renderFormations();
            if (formationSelector) formationSelector.value = id;
            alert(`Formation "${name}" saved successfully!`);
        });
    }

    // --- Save Custom Play Button ---
    const btnSavePlay = document.getElementById('btn-save-play');
    if (btnSavePlay) {
        btnSavePlay.addEventListener('click', () => {
            const name = prompt("Enter a name for this play (e.g., 'Center Leak'):");
            if (!name) return;
            
            const formationId = formationSelector ? formationSelector.value : 'singleback';
            const assignments = getCurrentPlayAssignments();
            
            const newPlay = {
                id: 'play_' + Date.now(),
                name: name,
                category: 'offense_pass',
                formation: formationId,
                assignments: assignments,
                ballTransfers: getActiveBallTransfers() 
            };
            
            savePlayToPlaybook(newPlay);
            renderPlaybook();
            if (playbookSelector) playbookSelector.value = newPlay.id;
            alert(`Play "${name}" saved to your playbook!`);
        });
    }

    // --- Wire Clear Play Button ---
    const btnClearPlay = document.getElementById('btn-clear-play');
    if (btnClearPlay) {
        btnClearPlay.addEventListener('click', () => {
            clearPlayRoutes();
        });
    }

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
    setDoubleTapHandler((nodeId, x, y) => {
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

        // Add the "Pass/Handoff" option
        const passOpt = document.createElement('div');
        passOpt.className = 'route-option';
        passOpt.innerHTML = `
            <svg viewBox="0 0 40 40" stroke="#8B4513" stroke-width="4" fill="transparent" stroke-linecap="round">
                <ellipse cx="20" cy="20" rx="8" ry="12" fill="#8B4513" stroke="white" stroke-width="2"></ellipse>
            </svg>
            <span class="route-label">Pass/Hand</span>
        `;
        passOpt.addEventListener('click', () => {
            const targetNode = prompt("Pass to which player position? (0-6)\n0:Center, 1:QB, 2:RB, etc.", "2");
            if (targetNode !== null) {
                const timeSec = prompt("Wait how many seconds after the snap before passing/handing off? (e.g., 1.5)", "1.5");
                if (timeSec !== null) {
                    const fromIndex = parseInt(activePlayerNodeId.split('_')[2]);
                    const toIndex = parseInt(targetNode);
                    const timeMs = parseFloat(timeSec) * 1000;
                    
                    if (!isNaN(toIndex) && !isNaN(timeMs)) {
                        addBallTransfer(fromIndex, toIndex, timeMs);
                        alert(`Ball sequence recorded!`);
                    }
                }
            }
            routeMenu.classList.remove('active');
        });
        routeMenu.appendChild(passOpt);

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
    renderFormations();
    renderPlaybook();
    renderRoster();
});