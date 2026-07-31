// src/field.js

import { getFormationCoordinates } from './formations.js';
import { getRouteData } from './routes.js'; 

let stage, backgroundLayer, formationLayer, routeLayer, telestratorLayer;
let football; 
let activeBallTransfers = []; 
let doubleTapCallback = null;

// Drawing State Variables
let isDrawingRoute = false;
let activeDrawingNode = null;
let customPathString = "";
let tempDrawLine = null;

// Telestrator State
let isTelestratorMode = false;
let currentTelestratorLine = null;

// Animation Timeline State
let currentTimeline = null; 
let isAnimatingPlay = false; // FLAG: Prevents the infinite player runaway loop

export function setDoubleTapHandler(callback) {
    doubleTapCallback = callback;
}

export function initField(containerId) {
    const container = document.getElementById(containerId);
    
    stage = new Konva.Stage({
        container: containerId,
        width: container.offsetWidth,
        height: container.offsetHeight,
    });

    backgroundLayer = new Konva.Layer();
    routeLayer = new Konva.Layer();
    formationLayer = new Konva.Layer();
    telestratorLayer = new Konva.Layer(); 
    
    stage.add(backgroundLayer);
    stage.add(routeLayer);
    stage.add(formationLayer);
    stage.add(telestratorLayer); 

    // Create the Football
    football = new Konva.Ellipse({
        radiusX: 8,
        radiusY: 12,
        fill: '#8B4513',
        stroke: 'white',
        strokeWidth: 2,
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.5
    });
    formationLayer.add(football);

    drawGrid(stage.width(), stage.height());
    drawDefaultFormation(stage.width(), stage.height());

    window.addEventListener('resize', resizeField);

    // --- CUSTOM ROUTE DRAWING LOGIC ---
    stage.on('mousedown touchstart', (e) => {
        if (!isDrawingRoute || !activeDrawingNode || isTelestratorMode) return;
        
        const pos = stage.getPointerPosition();
        customPathString = "M 0 0 "; 
        
        tempDrawLine = new Konva.Line({
            points: [pos.x, pos.y],
            stroke: '#ed8936',
            strokeWidth: 4,
            dash: [10, 8],
            lineCap: 'round',
            lineJoin: 'round'
        });
        routeLayer.add(tempDrawLine);
    });

    stage.on('mousemove touchmove', (e) => {
        if (!isDrawingRoute || !tempDrawLine || isTelestratorMode) return;
        e.evt.preventDefault(); 
        
        const pos = stage.getPointerPosition();
        const newPoints = tempDrawLine.points().concat([pos.x, pos.y]);
        tempDrawLine.points(newPoints);
        routeLayer.batchDraw();

        const relativeX = pos.x - activeDrawingNode.x();
        const relativeY = pos.y - activeDrawingNode.y();
        customPathString += ` L ${relativeX} ${relativeY}`;
    });

    stage.on('mouseup touchend', () => {
        if (!isDrawingRoute || !tempDrawLine || isTelestratorMode) return;
        
        tempDrawLine.destroy();
        tempDrawLine = null;
        
        assignRouteToPlayer(activeDrawingNode.id(), customPathString, { duration: 3000, delay: 0 });
        
        isDrawingRoute = false;
        activeDrawingNode = null;
        formationLayer.getChildren().forEach(n => n.draggable(true));
    });

    // --- TELESTRATOR DRAWING LOGIC ---
    stage.on('mousedown touchstart', (e) => {
        if (!isTelestratorMode || isDrawingRoute) return;
        
        const pos = stage.getPointerPosition();
        currentTelestratorLine = new Konva.Line({
            stroke: '#ecc94b', 
            strokeWidth: 5,
            lineCap: 'round',
            lineJoin: 'round',
            points: [pos.x, pos.y] 
        });
        
        telestratorLayer.add(currentTelestratorLine);
    });

    stage.on('mousemove touchmove', (e) => {
        if (!isTelestratorMode || !currentTelestratorLine || isDrawingRoute) return;
        e.evt.preventDefault(); 
        
        const pos = stage.getPointerPosition();
        const newPoints = currentTelestratorLine.points().concat([pos.x, pos.y]);
        currentTelestratorLine.points(newPoints);
        
        telestratorLayer.batchDraw();
    });

    stage.on('mouseup touchend', () => {
        if (isTelestratorMode) currentTelestratorLine = null; 
    });
}

export function resizeField() {
    const container = document.getElementById('canvas-container');
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;

    stage.width(newWidth);
    stage.height(newHeight);

    backgroundLayer.destroyChildren();
    drawGrid(newWidth, newHeight);
}

function drawGrid(width, height) {
    backgroundLayer.add(new Konva.Rect({ x: 0, y: 0, width: width, height: height, fill: '#2f855a' }));
    
    const totalVisibleYards = 25; 
    const yardHeight = height / totalVisibleYards;
    const padding = width * 0.1;
    const fieldWidth = width - (padding * 2);
    const yardWidth = fieldWidth / 30;

    backgroundLayer.add(new Konva.Line({ points: [padding, 0, padding, height], stroke: 'white', strokeWidth: 3 }));
    backgroundLayer.add(new Konva.Line({ points: [width - padding, 0, width - padding, height], stroke: 'white', strokeWidth: 3 }));

    for (let i = 0; i <= 25; i += 5) {
        const yPos = height - (i * yardHeight);
        
        backgroundLayer.add(new Konva.Line({
            points: [padding, yPos, width - padding, yPos],
            stroke: 'white',
            strokeWidth: i % 10 === 0 ? 3 : 1,
            opacity: 0.7
        }));

        if (i > 0 && i % 10 === 0) {
            const leftHashX = padding + (10 * yardWidth);
            const rightHashX = padding + (20 * yardWidth);
            const hashLength = yardHeight; 
            
            backgroundLayer.add(new Konva.Line({ points: [leftHashX, yPos - (hashLength/2), leftHashX, yPos + (hashLength/2)], stroke: 'white', strokeWidth: 2 }));
            backgroundLayer.add(new Konva.Line({ points: [rightHashX, yPos - (hashLength/2), rightHashX, yPos + (hashLength/2)], stroke: 'white', strokeWidth: 2 }));
        }
    }
}

function drawDefaultFormation(width, height) {
    const totalVisibleYards = 25; 
    const yardHeight = height / totalVisibleYards;
    const losY = height - (10 * yardHeight); 
    
    for (let i = 0; i < 7; i++) {
        const nodeX = (width * 0.25) + (i * (width * 0.5 / 6)); 
        
        const positionNode = new Konva.Group({
            id: 'player_node_' + i, 
            x: nodeX, 
            y: losY, 
            draggable: true
        });

        let defaultFill = '#e2e8f0';
        if (i === 0) defaultFill = '#68d391'; // Center
        if (i === 1) defaultFill = '#f6e05e'; // QB

        const circle = new Konva.Circle({
            x: 0, y: 0, radius: 28, fill: defaultFill, stroke: '#2d3748', strokeWidth: 3,
            name: 'playerShape'
        });

        const label = new Konva.Text({
            x: -28, y: -10, width: 56, align: 'center',
            text: '', fontSize: 18, fill: '#2d3748', fontStyle: 'bold',
            name: 'playerLabel'
        });

        positionNode.add(circle);
        positionNode.add(label);

        // Double Tap / Double Click to open the Route Menu
        positionNode.on('dblclick dbltap', (e) => {
            if (isTelestratorMode || isDrawingRoute) return; 
            
            // Stop the browser from zooming or opening context menus
            if (e.evt) e.evt.preventDefault();

            if (doubleTapCallback) {
                const containerPos = stage.container().getBoundingClientRect();
                const pointerPos = stage.getPointerPosition();
                doubleTapCallback(positionNode.id(), pointerPos.x + containerPos.left, pointerPos.y + containerPos.top);
            }
        });
        formationLayer.add(positionNode);
    }
    resetPlay();
}

export function handlePlayerDrop(dropX, dropY, playerInfo, onHighlightUpdate) {
    const nodes = formationLayer.getChildren(node => node.getClassName() === 'Group');
    let droppedNode = null;
    
    for (let node of nodes) {
        const dx = node.x() - dropX;
        const dy = node.y() - dropY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 45) {
            droppedNode = node;
            break;
        }
    }

    if (droppedNode) {
        nodes.forEach(node => {
            if (node.assignedPlayerId === playerInfo.id) {
                node.assignedPlayerId = null; 
                const oldCircle = node.findOne('.playerShape');
                const oldLabel = node.findOne('.playerLabel');
                if (oldCircle) oldCircle.fill('#e2e8f0'); 
                if (oldLabel) oldLabel.text(''); 
            }
        });

        droppedNode.assignedPlayerId = playerInfo.id;
        
        const circle = droppedNode.findOne('.playerShape');
        const label = droppedNode.findOne('.playerLabel');
        
        const nodeId = droppedNode.id();
        if (nodeId === 'player_node_0') {
            circle.fill('#68d391'); 
        } else if (nodeId === 'player_node_1') {
            circle.fill('#f6e05e'); 
        } else {
            circle.fill('#bee3f8'); 
        }

        if (label) label.text(playerInfo.number); 

        formationLayer.batchDraw();
        if (onHighlightUpdate) onHighlightUpdate();
    }
}

export function getAssignedPlayerIds() {
    return formationLayer.getChildren(node => node.getClassName() === 'Group')
        .map(node => node.assignedPlayerId)
        .filter(id => id !== undefined && id !== null);
}

export function assignRouteToPlayer(nodeId, routeData, routeConfig = { duration: 2000, delay: 0 }) {
    const player = formationLayer.findOne('#' + nodeId);
    if (!player) return;

    if (player.routeLine) {
        player.routeLine.destroy();
    }

    const path = new Konva.Path({
        x: player.x(),
        y: player.y(),
        data: routeData,
        stroke: '#e2e8f0', 
        strokeWidth: 4,
        dash: [10, 8],
        lineCap: 'round',
        lineJoin: 'round'
    });

    player.routeLine = path; 
    player.routeConfig = routeConfig; 
    player.routeData = routeData; 
    routeLayer.add(path);

    player.on('dragmove xChange yChange', () => {
        if (isAnimatingPlay) return; // FIX: Prevents infinite player runaway loop
        path.x(player.x());
        path.y(player.y());
    });
}

// --- Telestrator Controls ---
export function toggleTelestrator() {
    isTelestratorMode = !isTelestratorMode;
    formationLayer.getChildren().forEach(n => n.draggable(!isTelestratorMode));
    return isTelestratorMode; 
}

export function clearTelestrator() {
    telestratorLayer.destroyChildren(); 
    telestratorLayer.batchDraw();
}

export function enableCustomDrawing(nodeId) {
    activeDrawingNode = formationLayer.findOne('#' + nodeId);
    if (!activeDrawingNode) return;
    
    isDrawingRoute = true;
    formationLayer.getChildren().forEach(n => n.draggable(false));
}

// --- Animation Engine ---
export function runPlayAnimation(speedMultiplier, onUpdate) {
    const players = formationLayer.find('Group'); 
    
    if (currentTimeline) {
        currentTimeline.pause();
        resetPlay();
    }

    isAnimatingPlay = true; // Set Flag

    currentTimeline = anime.timeline({
        easing: 'linear',
        autoplay: true,
        update: function(anim) {
            if (onUpdate) onUpdate(anim.progress);
            
            // --- BALL TRACKING LOGIC ---
            const currentTime = anim.currentTime * speedMultiplier;
            let currentHolderIndex = 0; 
            
            for (let i = 0; i < activeBallTransfers.length; i++) {
                const transfer = activeBallTransfers[i];
                const endTime = transfer.time + transfer.flightDuration;
                
                if (currentTime >= transfer.time && currentTime <= endTime) {
                    const progress = (currentTime - transfer.time) / transfer.flightDuration;
                    const pFrom = formationLayer.findOne('#player_node_' + transfer.fromIndex);
                    const pTo = formationLayer.findOne('#player_node_' + transfer.toIndex);
                    
                    if (pFrom && pTo) {
                        football.x(pFrom.x() + (pTo.x() - pFrom.x()) * progress);
                        football.y(pFrom.y() + (pTo.y() - pFrom.y()) * progress);
                        currentHolderIndex = -1; 
                    }
                    break;
                } else if (currentTime > endTime) {
                    currentHolderIndex = transfer.toIndex; 
                }
            }
            
            if (currentHolderIndex !== -1) {
                const holder = formationLayer.findOne('#player_node_' + currentHolderIndex);
                if (holder) {
                    football.x(holder.x());
                    football.y(holder.y() - 30); 
                }
            }
        },
        complete: function() {
            isAnimatingPlay = false; // Unset Flag when animation naturally finishes
        }
    });

    let hasAnimations = false;

    players.forEach(player => {
        if (!player.routeLine) return; 
        hasAnimations = true;

        // FIX: Utilize Konva's built-in math to measure the line natively
        const pathLength = player.routeLine.getLength(); 
        const baseDuration = player.routeConfig ? player.routeConfig.duration : 2000;
        const baseDelay = player.routeConfig ? player.routeConfig.delay : 0;

        currentTimeline.add({
            targets: { value: 0 },
            value: pathLength,
            duration: baseDuration / speedMultiplier,
            delay: baseDelay / speedMultiplier,
            update: function(anim) {
                const currentProgress = anim.animations[0].currentValue;
                const point = player.routeLine.getPointAtLength(currentProgress);
                player.x(player.routeLine.x() + point.x);
                player.y(player.routeLine.y() + point.y);
                formationLayer.batchDraw();
            }
        }, 0); 
    });

    if (!hasAnimations) {
        alert("Assign routes to players before hitting PLAY!");
        isAnimatingPlay = false;
    }
}

export function seekTimeline(percentage) {
    if (currentTimeline) {
        currentTimeline.pause(); 
        currentTimeline.seek(currentTimeline.duration * (percentage / 100));
    }
}

export function setPlayerDelay(nodeId, delayMs) {
    const player = formationLayer.findOne('#' + nodeId);
    if (player && player.routeConfig) {
        player.routeConfig.delay = delayMs;
    } else {
        alert("Please assign a route to this player before setting a delay.");
    }
}

// --- FORMATIONS ENGINE ---
export function changeFormation(formationType, onComplete) {
    const width = stage.width();
    const height = stage.height();
    const targetFormation = getFormationCoordinates(formationType, width, height);

    let activeTweens = 0;

    for (let i = 0; i < 7; i++) {
        const player = formationLayer.findOne('#player_node_' + i);
        if (player) {
            activeTweens++;
            player.to({
                x: targetFormation[i].x,
                y: targetFormation[i].y,
                duration: 0.5,
                easing: Konva.Easings.EaseInOut,
                onUpdate: () => {
                    if (i === 0 && football) {
                        football.x(player.x());
                        football.y(player.y() - 30);
                        formationLayer.batchDraw();
                    }
                },
                onFinish: () => {
                    activeTweens--;
                    if (activeTweens === 0 && onComplete) {
                        onComplete();
                    }
                }
            });
        }
    }
}

export function loadPlayToField(playObject) {
    clearPlayRoutes();

    changeFormation(playObject.formation, () => {
        if (playObject.assignments) {
            for (const [playerIndex, assignment] of Object.entries(playObject.assignments)) {
                const routeData = assignment.routeData || getRouteData(assignment.routeId);
                if (routeData) {
                    const nodeId = 'player_node_' + playerIndex;
                    assignRouteToPlayer(nodeId, routeData, { duration: assignment.duration || 2000, delay: assignment.delay });
                    
                    const playerNode = formationLayer.findOne('#' + nodeId);
                    if (playerNode && playerNode.routeLine) {
                        playerNode.routeLine.x(playerNode.x());
                        playerNode.routeLine.y(playerNode.y());
                    }
                }
            }
        }
        routeLayer.batchDraw();
    });

    activeBallTransfers = playObject.ballTransfers || [{ time: 0, fromIndex: 0, toIndex: 1, flightDuration: 100 }];
    resetPlay();
}

export function clearPlayRoutes() {
    const players = formationLayer.find('Group');
    players.forEach(p => {
        if (p.routeLine) {
            p.routeLine.destroy();
            p.routeLine = null;
            p.routeData = null; 
        }
    });
    routeLayer.batchDraw();
    
    activeBallTransfers = [{ time: 0, fromIndex: 0, toIndex: 1, flightDuration: 100 }];
    resetPlay();
}

export function resetPlay() {
    if (currentTimeline) currentTimeline.pause(); 
    isAnimatingPlay = false; // Reset the runaway flag just in case play was aborted

    const players = formationLayer.find('Group');
    players.forEach(player => {
        if (player.routeLine) {
            player.x(player.routeLine.x());
            player.y(player.routeLine.y());
        }
    });
    
    const centerNode = formationLayer.findOne('#player_node_0');
    if (centerNode && football) {
        football.x(centerNode.x());
        football.y(centerNode.y() - 30); 
    }
    
    formationLayer.batchDraw();
}

// --- EXPORT CURRENT FIELD STATE FOR SAVING ---

export function getCurrentPlayerCoordinates() {
    const coordinates = [];
    for (let i = 0; i < 7; i++) {
        const player = formationLayer.findOne('#player_node_' + i);
        if (player) {
            coordinates.push({ x: player.x(), y: player.y() });
        }
    }
    return coordinates;
}

export function addBallTransfer(fromIndex, toIndex, timeMs, flightDuration = 400) {
    activeBallTransfers.push({ time: timeMs, fromIndex: fromIndex, toIndex: toIndex, flightDuration: flightDuration });
    activeBallTransfers.sort((a, b) => a.time - b.time); 
}

export function getActiveBallTransfers() {
    if (activeBallTransfers.length === 0) {
        return [{ time: 0, fromIndex: 0, toIndex: 1, flightDuration: 100 }];
    }
    return activeBallTransfers;
}

export function getCurrentPlayAssignments() {
    const assignments = {};
    for (let i = 0; i < 7; i++) {
        const player = formationLayer.findOne('#player_node_' + i);
        if (player && player.routeData) { 
            assignments[i] = {
                routeData: player.routeData,
                delay: player.routeConfig ? player.routeConfig.delay : 0,
                duration: player.routeConfig ? player.routeConfig.duration : 2000
            };
        }
    }
    return assignments;
}