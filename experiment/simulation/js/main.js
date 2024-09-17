// script.js
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const potentialDepthSlider = document.getElementById('potentialDepth');
const latticeSpacingSlider = document.getElementById('latticeSpacing');
const potentialDepthValue = document.getElementById('potentialDepthValue');
const latticeSpacingValue = document.getElementById('latticeSpacingValue');

let potentialDepth = potentialDepthSlider.value;
let latticeSpacing = latticeSpacingSlider.value;

function drawKronigPenney() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPotential();
    drawEnergyBands();
    drawWaveFunctions();
}

function drawPotential() {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    let numberOfWells = Math.floor(canvas.width / (latticeSpacing * 10));

    for (let i = 0; i < numberOfWells; i++) {
        let xStart = i * latticeSpacing * 10;
        ctx.beginPath();
        ctx.moveTo(xStart, canvas.height / 2);
        ctx.lineTo(xStart, canvas.height / 2 - potentialDepth);
        ctx.lineTo(xStart + latticeSpacing * 5, canvas.height / 2 - potentialDepth);
        ctx.lineTo(xStart + latticeSpacing * 5, canvas.height / 2);
        ctx.stroke();
    }
}

function drawEnergyBands() {
    ctx.strokeStyle = '#00f';
    ctx.lineWidth = 1;
    let numberOfBands = 5;

    for (let i = 0; i < numberOfBands; i++) {
        let energy = (i + 1) * potentialDepth / 6;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2 - energy);
        ctx.lineTo(canvas.width, canvas.height / 2 - energy);
        ctx.stroke();
    }
}

function drawWaveFunctions() {
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    let numberOfFunctions = 5;
    let amplitude = 50;

    for (let i = 0; i < numberOfFunctions; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
            let y = canvas.height / 2 - Math.sin((x * 2 * Math.PI / latticeSpacing) + i) * amplitude / (i + 1);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

function updateSimulation() {
    potentialDepth = potentialDepthSlider.value;
    latticeSpacing = latticeSpacingSlider.value;
    potentialDepthValue.textContent = potentialDepth;
    latticeSpacingValue.textContent = latticeSpacing;
    drawKronigPenney();
}

potentialDepthSlider.addEventListener('input', updateSimulation);
latticeSpacingSlider.addEventListener('input', updateSimulation);

updateSimulation();
