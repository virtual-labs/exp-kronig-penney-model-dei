// Kronig-Penney Model - Interactive Simulation
// Educational Physics Visualization

class KronigPenneySimulation {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Parameters
        this.params = {
            potentialDepth: 50,
            barrierWidth: 10,
            wellWidth: 30,
            animationSpeed: 1,
            time: 0
        };

        // Display options
        this.display = {
            showPotential: true,
            showBands: true,
            showWavefunction: true,
            showBandGaps: true,
            showLabels: true
        };

        // Animation state
        this.isPlaying = false;
        this.animationId = null;
        this.currentView = 'combined';
        this.currentMode = 'explore';

        // Material presets
        this.presets = {
            conductor: { potentialDepth: 15, barrierWidth: 5, wellWidth: 60 },
            semiconductor: { potentialDepth: 50, barrierWidth: 15, wellWidth: 35 },
            insulator: { potentialDepth: 90, barrierWidth: 30, wellWidth: 20 },
            custom: { potentialDepth: 50, barrierWidth: 10, wellWidth: 30 }
        };

        // Quiz data
        this.quizQuestions = [
            { q: "What happens to the band gap when potential depth increases?", options: ["Decreases", "Increases", "Stays same", "Becomes zero"], correct: 1 },
            { q: "In conductors, how do energy bands behave?", options: ["Wide gaps", "Overlap", "No bands", "Single band"], correct: 1 },
            { q: "What does Bloch's theorem describe?", options: ["Band gaps", "Wave functions in periodic potential", "Free electrons", "Thermal energy"], correct: 1 },
            { q: "Semiconductors have:", options: ["No band gap", "Wide band gap", "Narrow band gap", "Overlapping bands"], correct: 2 },
            { q: "The Kronig-Penney model uses:", options: ["Circular potential", "Rectangular potential wells", "Exponential decay", "Random potential"], correct: 1 }
        ];
        this.currentQuizIndex = 0;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();
        this.updateSimulation();
        this.loadSavedNotes();
        this.loadSavedTheme();
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('kronigPenneyTheme');
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            document.body.setAttribute('data-theme', 'light');
            const themeBtn = document.getElementById('themeToggle');
            if (themeBtn) {
                themeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>`;
            }
        }
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight - 100;
            this.draw();
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    bindEvents() {
        // Sliders and inputs
        const controls = [
            { slider: 'potentialDepth', input: 'potentialDepthInput', param: 'potentialDepth' },
            { slider: 'barrierWidth', input: 'barrierWidthInput', param: 'barrierWidth' },
            { slider: 'wellWidth', input: 'wellWidthInput', param: 'wellWidth' }
        ];

        controls.forEach(ctrl => {
            const slider = document.getElementById(ctrl.slider);
            const input = document.getElementById(ctrl.input);

            if (slider && input) {
                slider.addEventListener('input', () => {
                    this.params[ctrl.param] = parseFloat(slider.value);
                    input.value = slider.value;
                    this.setActivePreset('custom');
                    this.updateSimulation();
                });

                input.addEventListener('change', () => {
                    let val = parseFloat(input.value);
                    val = Math.max(slider.min, Math.min(slider.max, val));
                    this.params[ctrl.param] = val;
                    slider.value = val;
                    input.value = val;
                    this.setActivePreset('custom');
                    this.updateSimulation();
                });
            }
        });

        // Display checkboxes
        const checkboxes = ['showPotential', 'showBands', 'showWavefunction', 'showBandGaps', 'showLabels'];
        checkboxes.forEach(id => {
            const cb = document.getElementById(id);
            if (cb) {
                cb.addEventListener('change', () => {
                    this.display[id] = cb.checked;
                    this.draw();
                });
            }
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.draw();
            });
        });

        // Learning mode tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.dataset.mode;
                this.updateLearningMode();
            });
        });

        // Animation controls
        const playBtn = document.getElementById('playPauseBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.toggleAnimation());
        }

        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAnimation());
        }

        const speedSlider = document.getElementById('animationSpeed');
        if (speedSlider) {
            speedSlider.addEventListener('input', () => {
                this.params.animationSpeed = parseFloat(speedSlider.value);
                document.getElementById('speedValue').textContent = speedSlider.value + 'x';
            });
        }

        // Calculate button
        const calcBtn = document.getElementById('calculateBtn');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => this.showCalculation());
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Help modal
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeHelp = document.getElementById('closeHelpModal');

        if (helpBtn && helpModal) {
            helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
            closeHelp.addEventListener('click', () => helpModal.classList.add('hidden'));
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) helpModal.classList.add('hidden');
            });
        }

        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Notes
        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', () => this.saveNotes());
        }

        // Quiz options
        document.querySelectorAll('.quiz-option').forEach((btn, idx) => {
            btn.addEventListener('click', () => this.checkAnswer(idx));
        });
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        this.params.potentialDepth = preset.potentialDepth;
        this.params.barrierWidth = preset.barrierWidth;
        this.params.wellWidth = preset.wellWidth;

        // Update UI
        document.getElementById('potentialDepth').value = preset.potentialDepth;
        document.getElementById('potentialDepthInput').value = preset.potentialDepth;
        document.getElementById('barrierWidth').value = preset.barrierWidth;
        document.getElementById('barrierWidthInput').value = preset.barrierWidth;
        document.getElementById('wellWidth').value = preset.wellWidth;
        document.getElementById('wellWidthInput').value = preset.wellWidth;

        this.setActivePreset(presetName);
        this.updateSimulation();
        this.showToast(`Applied ${presetName} preset`, 'success');
    }

    setActivePreset(presetName) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === presetName);
        });
    }

    updateSimulation() {
        this.calculateResults();
        this.updateObservations();
        this.draw();
    }

    calculateResults() {
        const V0 = this.params.potentialDepth;
        const b = this.params.barrierWidth;
        const a = this.params.wellWidth;

        // Calculate band gap (simplified model)
        const bandGap = (V0 * b) / (a + b) * 0.1;
        const firstBandMax = V0 * 0.15;

        // Determine material type
        let materialType = 'Semiconductor';
        let effectiveMass = 0.067;

        if (bandGap < 0.5) {
            materialType = 'Conductor';
            effectiveMass = 1.0;
        } else if (bandGap > 3) {
            materialType = 'Insulator';
            effectiveMass = 0.5;
        }

        // Update UI
        document.getElementById('bandGapValue').textContent = bandGap.toFixed(2) + ' eV';
        document.getElementById('firstBandValue').textContent = `0 - ${firstBandMax.toFixed(1)} eV`;
        document.getElementById('materialType').textContent = materialType;
        document.getElementById('effectiveMass').textContent = `m*/m₀ = ${effectiveMass.toFixed(3)}`;
    }

    updateObservations() {
        const V0 = this.params.potentialDepth;
        const observations = document.querySelectorAll('.observation-item');

        observations.forEach((obs, idx) => {
            obs.classList.remove('active');
            if (idx === 0) obs.classList.add('active');

            if (V0 > 70 && idx === 2) {
                obs.classList.add('active');
            }
        });
    }

    draw() {
        const { ctx, canvas } = this;
        const { width, height } = canvas;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw based on current view
        switch (this.currentView) {
            case 'potential':
                this.drawPotentialView();
                break;
            case 'bands':
                this.drawBandsView();
                break;
            default:
                this.drawCombinedView();
        }
    }

    drawCombinedView() {
        if (this.display.showBandGaps) this.drawBandGaps();
        if (this.display.showPotential) this.drawPotential();
        if (this.display.showBands) this.drawEnergyBands();
        if (this.display.showWavefunction) this.drawWaveFunctions();
        if (this.display.showLabels) this.drawLabels();
    }

    drawPotentialView() {
        this.drawPotential();
        this.drawLabels();
    }

    drawBandsView() {
        this.drawEKDiagram();
    }

    drawPotential() {
        const { ctx, canvas, params } = this;
        const { width, height } = canvas;
        const { potentialDepth, barrierWidth, wellWidth } = params;

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;

        const baseline = height * 0.7;
        const scale = height * 0.004;
        const periodWidth = (wellWidth + barrierWidth) * 3;
        const numPeriods = Math.ceil(width / periodWidth) + 1;

        ctx.beginPath();

        for (let i = -1; i < numPeriods; i++) {
            const xStart = i * periodWidth;
            const wellEnd = xStart + wellWidth * 3;
            const barrierEnd = wellEnd + barrierWidth * 3;

            // Well region (low potential)
            ctx.moveTo(xStart, baseline);
            ctx.lineTo(wellEnd, baseline);

            // Barrier rise
            ctx.lineTo(wellEnd, baseline - potentialDepth * scale);
            ctx.lineTo(barrierEnd, baseline - potentialDepth * scale);
            ctx.lineTo(barrierEnd, baseline);
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw baseline
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, baseline);
        ctx.lineTo(width, baseline);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawEnergyBands() {
        const { ctx, canvas, params } = this;
        const { width, height } = canvas;
        const { potentialDepth } = params;

        const baseline = height * 0.7;
        const numBands = 5;

        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;

        for (let i = 0; i < numBands; i++) {
            const energy = (i + 1) * potentialDepth * height * 0.004 / 6;
            const alpha = 1 - (i * 0.15);

            ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
            ctx.shadowColor = '#00b4ff';

            ctx.beginPath();
            ctx.moveTo(0, baseline - energy);
            ctx.lineTo(width, baseline - energy);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    }

    drawBandGaps() {
        const { ctx, canvas, params } = this;
        const { width, height } = canvas;
        const { potentialDepth } = params;

        const baseline = height * 0.7;
        const numGaps = 4;

        for (let i = 0; i < numGaps; i++) {
            const topEnergy = (i + 1.5) * potentialDepth * height * 0.004 / 6;
            const bottomEnergy = (i + 1) * potentialDepth * height * 0.004 / 6;
            const gapHeight = topEnergy - bottomEnergy;

            ctx.fillStyle = `rgba(255, 107, 107, ${0.15 - i * 0.03})`;
            ctx.fillRect(0, baseline - topEnergy, width, gapHeight);
        }
    }

    drawWaveFunctions() {
        const { ctx, canvas, params } = this;
        const { width, height } = canvas;
        const { wellWidth, time, animationSpeed } = params;

        const baseline = height * 0.7;
        const amplitude = 30;
        const numWaves = 3;

        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;

        for (let w = 0; w < numWaves; w++) {
            const wavelength = wellWidth * 3 * (w + 1);
            const offset = baseline - 50 - w * 40;
            const alpha = 0.8 - w * 0.2;

            ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
            ctx.shadowColor = '#ff6b6b';

            ctx.beginPath();
            for (let x = 0; x <= width; x += 2) {
                const phase = time * animationSpeed * 0.02;
                const y = offset + Math.sin((x / wavelength) * 2 * Math.PI + phase + w) * amplitude / (w + 1);

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
    }

    drawLabels() {
        const { ctx, canvas, params } = this;
        const { width, height } = canvas;

        ctx.font = '12px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';

        // Y-axis label
        ctx.save();
        ctx.translate(20, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Energy (E)', 0, 0);
        ctx.restore();

        // X-axis label
        ctx.fillText('Position (x)', width / 2 - 30, height - 10);

        // Dimension labels
        const baseline = height * 0.7;
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`V₀ = ${params.potentialDepth} eV`, 50, 30);
        ctx.fillStyle = '#00b4ff';
        ctx.fillText(`a = ${params.wellWidth} Å`, 150, 30);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`b = ${params.barrierWidth} Å`, 250, 30);
    }

    drawEKDiagram() {
        const { ctx, canvas, params } = this;
        const { width, height } = canvas;
        const { potentialDepth } = params;

        const centerX = width / 2;
        const centerY = height / 2;
        const axisLength = Math.min(width, height) * 0.4;

        // Draw axes
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;

        // k-axis
        ctx.beginPath();
        ctx.moveTo(centerX - axisLength, centerY);
        ctx.lineTo(centerX + axisLength, centerY);
        ctx.stroke();

        // E-axis
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + axisLength * 0.5);
        ctx.lineTo(centerX, centerY - axisLength);
        ctx.stroke();

        // Draw E(k) curves (bands)
        const numBands = 4;
        ctx.lineWidth = 3;

        for (let band = 0; band < numBands; band++) {
            const bandOffset = band * 50 + 30;
            const gapSize = potentialDepth * 0.3;

            ctx.strokeStyle = '#00b4ff';
            ctx.shadowColor = '#00b4ff';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            for (let k = -axisLength; k <= axisLength; k += 2) {
                const normalizedK = k / axisLength;
                const E = bandOffset + (1 - Math.cos(normalizedK * Math.PI)) * 20;
                const y = centerY - E;

                if (k === -axisLength) ctx.moveTo(centerX + k, y);
                else ctx.lineTo(centerX + k, y);
            }
            ctx.stroke();

            // Draw band gap region
            if (band < numBands - 1) {
                ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
                ctx.fillRect(centerX - axisLength, centerY - bandOffset - gapSize, axisLength * 2, gapSize * 0.5);
            }
        }

        ctx.shadowBlur = 0;

        // Labels
        ctx.font = '14px Inter';
        ctx.fillStyle = 'white';
        ctx.fillText('k', centerX + axisLength + 10, centerY + 5);
        ctx.fillText('E(k)', centerX + 10, centerY - axisLength - 10);
        ctx.fillText('-π/a', centerX - axisLength - 5, centerY + 20);
        ctx.fillText('π/a', centerX + axisLength - 10, centerY + 20);
    }

    toggleAnimation() {
        this.isPlaying = !this.isPlaying;

        const playBtn = document.getElementById('playPauseBtn');
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');

        playBtn.classList.toggle('playing', this.isPlaying);
        playIcon.classList.toggle('hidden', this.isPlaying);
        pauseIcon.classList.toggle('hidden', !this.isPlaying);

        if (this.isPlaying) {
            this.animate();
        } else {
            cancelAnimationFrame(this.animationId);
        }
    }

    animate() {
        if (!this.isPlaying) return;

        this.params.time += this.params.animationSpeed;
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    resetAnimation() {
        this.isPlaying = false;
        this.params.time = 0;

        const playBtn = document.getElementById('playPauseBtn');
        playBtn.classList.remove('playing');
        playBtn.querySelector('.play-icon').classList.remove('hidden');
        playBtn.querySelector('.pause-icon').classList.add('hidden');

        cancelAnimationFrame(this.animationId);
        this.draw();
        this.showToast('Animation reset', 'info');
    }

    updateLearningMode() {
        const quizSection = document.getElementById('quizSection');
        const stepIndicator = document.getElementById('stepIndicator');

        // Handle Quiz Section
        if (this.currentMode === 'quiz') {
            quizSection.classList.remove('hidden');
            this.loadQuizQuestion();
        } else {
            quizSection.classList.add('hidden');
        }

        // Handle Step Indicator (Guided Mode)
        if (this.currentMode === 'guided') {
            stepIndicator.style.display = 'flex';
            this.showToast('Entered Guided Mode. Follow the steps!', 'info');
            // Reset to step 1
            this.updateGuidedStep(1);
        } else {
            stepIndicator.style.display = 'none';
        }

        if (this.currentMode === 'explore') {
            this.showToast('Explore Mode: Experiment freely!', 'success');
        }
    }

    updateGuidedStep(stepNum) {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, idx) => {
            if (idx + 1 < stepNum) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (idx + 1 === stepNum) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    loadQuizQuestion() {
        const question = this.quizQuestions[this.currentQuizIndex];
        document.getElementById('quizQuestion').textContent = question.q;
        document.querySelector('.quiz-progress').textContent = `Q${this.currentQuizIndex + 1}/${this.quizQuestions.length}`;

        const options = document.querySelectorAll('.quiz-option');
        options.forEach((btn, idx) => {
            btn.textContent = question.options[idx];
            btn.classList.remove('correct', 'incorrect');
            btn.disabled = false;
        });

        document.getElementById('quizFeedback').classList.add('hidden');
    }

    checkAnswer(selectedIdx) {
        const question = this.quizQuestions[this.currentQuizIndex];
        const isCorrect = selectedIdx === question.correct;

        const options = document.querySelectorAll('.quiz-option');
        options.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === question.correct) btn.classList.add('correct');
            else if (idx === selectedIdx && !isCorrect) btn.classList.add('incorrect');
        });

        const feedback = document.getElementById('quizFeedback');
        feedback.classList.remove('hidden', 'correct', 'incorrect');
        feedback.classList.add(isCorrect ? 'correct' : 'incorrect');
        feedback.textContent = isCorrect ? '✓ Correct! Well done!' : '✗ Incorrect. The correct answer is highlighted.';

        // Move to next question after delay
        setTimeout(() => {
            this.currentQuizIndex = (this.currentQuizIndex + 1) % this.quizQuestions.length;
            this.loadQuizQuestion();
        }, 2000);
    }

    showCalculation() {
        const V0 = this.params.potentialDepth;
        const b = this.params.barrierWidth;
        const a = this.params.wellWidth;
        const bandGap = (V0 * b) / (a + b) * 0.1;

        this.showToast(`Band Gap = (V₀ × b)/(a+b) × 0.1 = ${bandGap.toFixed(2)} eV`, 'success');
    }

    exportData() {
        const data = {
            parameters: this.params,
            results: {
                bandGap: document.getElementById('bandGapValue').textContent,
                firstBand: document.getElementById('firstBandValue').textContent,
                materialType: document.getElementById('materialType').textContent,
                effectiveMass: document.getElementById('effectiveMass').textContent
            },
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kronig-penney-data-${Date.now()}.json`;
        a.click();

        this.showToast('Data exported successfully!', 'success');
    }

    toggleTheme() {
        const html = document.documentElement;
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? '' : 'light';

        // Apply to both html and body for full coverage
        html.setAttribute('data-theme', newTheme);
        body.setAttribute('data-theme', newTheme);

        // Update theme toggle button icon
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            if (newTheme === 'light') {
                themeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>`;
            } else {
                themeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>`;
            }
        }

        // Save theme preference
        localStorage.setItem('kronigPenneyTheme', newTheme);

        // Redraw canvas
        this.draw();
        this.showToast(`Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} theme`, 'info');
    }

    saveNotes() {
        const notes = document.getElementById('userNotes').value;
        localStorage.setItem('kronigPenneyNotes', notes);
        this.showToast('Notes saved!', 'success');
    }

    loadSavedNotes() {
        const savedNotes = localStorage.getItem('kronigPenneyNotes');
        if (savedNotes) {
            document.getElementById('userNotes').value = savedNotes;
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span><span>${message}</span>`;

        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize simulation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.simulation = new KronigPenneySimulation();
});
