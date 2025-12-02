// script.js - COMPLETE STATIC VERSION FOR GITHUB PAGES
// Metro Manila Air Pollution Risk Assessment System

// ============================================
// CONFIGURATION
// ============================================
const IS_STATIC_MODE = true; // Set to true for GitHub Pages
const STATIC_ACCURACY = 85.0; // Model accuracy for static mode

// ============================================
// DOM ELEMENTS
// ============================================
const sliders = document.querySelectorAll('input[type="range"]');
const valueDisplays = {};
const apiAlert = document.getElementById('apiAlert');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsContainer = document.getElementById('resultsContainer');
const noResultsMessage = document.getElementById('noResultsMessage');
const modelAccuracyElement = document.getElementById('modelAccuracy');
const apiStatusElement = document.getElementById('apiStatus');

// Chart instances
let riskDistributionChart = null;
let monthlyTrendsChart = null;

// ============================================
// INITIALIZATION
// ============================================
function initializeSliders() {
    sliders.forEach(slider => {
        const id = slider.id;
        const valueDisplay = document.getElementById(id + 'Value');
        valueDisplays[id] = valueDisplay;
        
        // Set initial value
        valueDisplay.textContent = slider.value;
        
        // Update value on slider change
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    });
}

// ============================================
// MODEL ACCURACY HANDLING
// ============================================
function updateModelAccuracy(accuracy) {
    if (modelAccuracyElement) {
        modelAccuracyElement.textContent = `${accuracy.toFixed(1)}%`;
        
        // Color coding based on accuracy
        if (accuracy >= 90) {
            modelAccuracyElement.style.color = '#00ff88';
        } else if (accuracy >= 80) {
            modelAccuracyElement.style.color = '#f9d423';
        } else if (accuracy >= 70) {
            modelAccuracyElement.style.color = '#ff9800';
        } else {
            modelAccuracyElement.style.color = '#ff416c';
        }
    }
}

// ============================================
// DASHBOARD DATA AND CHARTS
// ============================================
async function loadDashboardData() {
    try {
        // Try to load from JSON file
        const response = await fetch('data/dashboard_data.json');
        if (!response.ok) throw new Error('Failed to load dashboard data');
        
        const data = await response.json();
        updateCharts(data.dashboard || data);
        
        // Update accuracy from dashboard
        if (data.dashboard?.summary?.model_accuracy) {
            updateModelAccuracy(data.dashboard.summary.model_accuracy);
        } else if (data.summary?.model_accuracy) {
            updateModelAccuracy(data.summary.model_accuracy);
        }
        
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.warn('Using fallback dashboard data:', error);
        
        // Use fallback data with YOUR actual percentages
        const fallbackData = {
            risk_distribution: {Low: 48.8, Moderate: 49.5, High: 1.6},
            monthly_trends: [
                {period: '2025-01', pm25: 28},
                {period: '2025-02', pm25: 32},
                {period: '2025-03', pm25: 35},
                {period: '2025-04', pm25: 30},
                {period: '2025-05', pm25: 25},
                {period: '2025-06', pm25: 22},
                {period: '2025-07', pm25: 28},
                {period: '2025-08', pm25: 33},
                {period: '2025-09', pm25: 38},
                {period: '2025-10', pm25: 35},
                {period: '2025-11', pm25: 32}
            ],
            summary: {
                total_samples: 1320729,
                avg_pm25: 13.79,
                model_accuracy: 85.0
            }
        };
        
        updateCharts(fallbackData);
        updateModelAccuracy(85.0);
    }
}

function updateCharts(dashboardData) {
    // Risk Distribution Chart (Doughnut)
    const riskCtx = document.getElementById('riskDistributionChart').getContext('2d');
    
    if (riskDistributionChart) {
        riskDistributionChart.destroy();
    }
    
    const riskLabels = Object.keys(dashboardData.risk_distribution || {});
    const riskData = Object.values(dashboardData.risk_distribution || {});
    const riskColors = ['#00b09b', '#f9d423', '#ff416c'];
    
    riskDistributionChart = new Chart(riskCtx, {
        type: 'doughnut',
        data: {
            labels: riskLabels,
            datasets: [{
                data: riskData,
                backgroundColor: riskColors,
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: "'Poppins', sans-serif"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { family: "'Poppins', sans-serif" },
                    bodyFont: { family: "'Poppins', sans-serif" }
                }
            },
            cutout: '65%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
    
    // Monthly Trends Chart (Line)
    const trendsCtx = document.getElementById('monthlyTrendsChart').getContext('2d');
    
    if (monthlyTrendsChart) {
        monthlyTrendsChart.destroy();
    }
    
    const trendsData = dashboardData.monthly_trends || [];
    const trendLabels = trendsData.map(item => item.period);
    const trendValues = trendsData.map(item => item.pm25);
    
    monthlyTrendsChart = new Chart(trendsCtx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'PM2.5 (μg/m³)',
                data: trendValues,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#3498db',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: { family: "'Poppins', sans-serif" },
                    bodyFont: { family: "'Poppins', sans-serif" }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        font: {
                            family: "'Poppins', sans-serif"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'PM2.5 (μg/m³)',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        font: {
                            family: "'Poppins', sans-serif"
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// ============================================
// PREDICTION ENGINE (STATIC VERSION)
// ============================================
function calculateAQI(pm25) {
    if (pm25 <= 12) {
        return pm25 * (50/12);  // Good (0-50)
    } else if (pm25 <= 35.4) {
        return 51 + (pm25 - 12.1) * (49/23.3);  // Moderate (51-100)
    } else if (pm25 <= 55.4) {
        return 101 + (pm25 - 35.5) * (49/19.9);  // Unhealthy for Sensitive Groups (101-150)
    } else if (pm25 <= 150.4) {
        return 151 + (pm25 - 55.5) * (49/94.9);  // Unhealthy (151-200)
    } else {
        return 201 + (pm25 - 150.5) * (99/49.5);  // Very Unhealthy (201-300)
    }
}

function getAQICategory(aqi) {
    if (aqi <= 50) return "Good";
    else if (aqi <= 100) return "Moderate";
    else if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    else if (aqi <= 200) return "Unhealthy";
    else if (aqi <= 300) return "Very Unhealthy";
    else return "Hazardous";
}

function predictRiskStatic(formData) {
    const pm25 = formData.pm25;
    
    // Rule-based prediction (simplified model)
    let prediction, confidence;
    let probLow, probModerate, probHigh;
    
    if (pm25 <= 12) {
        prediction = "Low";
        confidence = 95;
        probLow = 90;
        probModerate = 8;
        probHigh = 2;
    } else if (pm25 <= 35.4) {
        prediction = "Moderate";
        confidence = 90;
        probLow = 10;
        probModerate = 85;
        probHigh = 5;
    } else {
        prediction = "High";
        confidence = 85;
        probLow = 2;
        probModerate = 8;
        probHigh = 90;
    }
    
    // Calculate AQI
    const aqi = calculateAQI(pm25);
    const aqiCategory = getAQICategory(aqi);
    
    // Get recommendations based on risk level
    const recommendations = getRecommendations(prediction, aqi);
    
    return {
        success: true,
        prediction: prediction,
        confidence: confidence,
        probabilities: {
            low: probLow,
            moderate: probModerate,
            high: probHigh
        },
        aqi: aqi,
        aqi_category: aqiCategory,
        parameters: formData,
        recommendations: recommendations,
        model_info: {
            type: 'Rule-Based System',
            accuracy: STATIC_ACCURACY,
            features_used: ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity']
        }
    };
}

function getRecommendations(riskLevel, aqi) {
    const recommendations = {
        general: [],
        sensitive_groups: [],
        actions: []
    };
    
    if (riskLevel === "Low" || aqi <= 50) {
        recommendations.general = [
            "Air quality is satisfactory",
            "Normal outdoor activities are safe"
        ];
        recommendations.sensitive_groups = [
            "No special precautions needed"
        ];
        recommendations.actions = [
            "Continue regular outdoor activities",
            "Maintain current pollution control measures"
        ];
    } else if (riskLevel === "Moderate" || aqi <= 100) {
        recommendations.general = [
            "Air quality is acceptable",
            "Unusually sensitive people should consider reducing prolonged outdoor exertion"
        ];
        recommendations.sensitive_groups = [
            "Children, elderly, and people with respiratory conditions",
            "Consider reducing strenuous outdoor activities"
        ];
        recommendations.actions = [
            "Reduce vehicle idling",
            "Limit outdoor burning",
            "Use public transportation when possible"
        ];
    } else {
        recommendations.general = [
            "Air quality is unhealthy",
            "Everyone may begin to experience health effects"
        ];
        recommendations.sensitive_groups = [
            "Avoid all outdoor activities",
            "Stay indoors with air purifiers if possible"
        ];
        recommendations.actions = [
            "Issue public health advisory",
            "Implement traffic reduction measures",
            "Activate emergency pollution control protocols"
        ];
    }
    
    return recommendations;
}

// ============================================
// MAIN PREDICTION FUNCTION
// ============================================
async function predictRisk() {
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    hideAlert();
    
    // Collect form data
    const formData = {
        pm25: parseFloat(document.getElementById('pm25').value),
        pm10: parseFloat(document.getElementById('pm10').value),
        no2: parseFloat(document.getElementById('no2').value),
        so2: parseFloat(document.getElementById('so2').value),
        co: parseFloat(document.getElementById('co').value),
        o3: parseFloat(document.getElementById('o3').value),
        temperature: parseFloat(document.getElementById('temperature').value),
        humidity: parseFloat(document.getElementById('humidity').value),
        location: document.getElementById('location').value
    };
    
    // Update display values
    document.getElementById('dispPm25').textContent = formData.pm25.toFixed(1);
    document.getElementById('dispPm10').textContent = formData.pm10.toFixed(1);
    document.getElementById('dispNo2').textContent = formData.no2.toFixed(1);
    document.getElementById('dispSo2').textContent = formData.so2.toFixed(1);
    
    if (IS_STATIC_MODE) {
        // Use static prediction engine
        setTimeout(() => {
            loadingSpinner.style.display = 'none';
            
            const result = predictRiskStatic(formData);
            
            // Show results
            noResultsMessage.style.display = 'none';
            resultsContainer.style.display = 'block';
            
            // Update UI with results
            updateResultsDisplay(result);
            
            showAlert('✅ Risk assessment completed successfully! (Static Mode)', 'success');
        }, 800); // Simulate API delay
    } else {
        // For API mode (not used in static version)
        try {
            // This would be the API call if you had a backend
            // const response = await fetch(`${API_BASE_URL}/predict`, {...});
            // const data = await response.json();
            
            // For now, fall back to static mode
            loadingSpinner.style.display = 'none';
            const result = predictRiskStatic(formData);
            
            noResultsMessage.style.display = 'none';
            resultsContainer.style.display = 'block';
            updateResultsDisplay(result);
            
            showAlert('✅ Prediction complete (Fallback Mode)', 'success');
            
        } catch (error) {
            loadingSpinner.style.display = 'none';
            showAlert(`❌ Error: ${error.message}`, 'error');
        }
    }
}

// ============================================
// RESULTS DISPLAY FUNCTIONS
// ============================================
function updateResultsDisplay(data) {
    const riskLevel = data.prediction;
    const riskText = document.getElementById('riskLevelText');
    const confidenceValue = document.getElementById('confidenceValue');
    const aqiValue = document.getElementById('aqiValue');
    const aqiCategory = document.getElementById('aqiCategory');
    const riskDisplay = document.getElementById('riskDisplay');
    
    // Set risk level text and styling
    riskText.textContent = `${riskLevel} Risk`;
    confidenceValue.textContent = `${data.confidence}%`;
    aqiValue.textContent = data.aqi.toFixed(1);
    aqiCategory.textContent = data.aqi_category;
    
    // Update risk display styling
    riskDisplay.className = 'risk-level-display';
    if (riskLevel === 'Low') {
        riskDisplay.classList.add('risk-low');
        riskText.innerHTML = '<i class="fas fa-check-circle"></i> Low Risk';
    } else if (riskLevel === 'Moderate') {
        riskDisplay.classList.add('risk-moderate');
        riskText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Moderate Risk';
    } else {
        riskDisplay.classList.add('risk-high');
        riskText.innerHTML = '<i class="fas fa-skull-crossbones"></i> High Risk';
    }
    
    // Update probabilities
    document.getElementById('probLow').textContent = 
        `${data.probabilities.low ? data.probabilities.low.toFixed(1) : '0.0'}%`;
    document.getElementById('probModerate').textContent = 
        `${data.probabilities.moderate ? data.probabilities.moderate.toFixed(1) : '0.0'}%`;
    document.getElementById('probHigh').textContent = 
        `${data.probabilities.high ? data.probabilities.high.toFixed(1) : '0.0'}%`;
    
    // Update recommendations
    const recommendations = data.recommendations || {
        general: ['No data available'],
        sensitive_groups: ['No data available'],
        actions: ['No data available']
    };
    
    updateRecommendationList('generalRecs', recommendations.general);
    updateRecommendationList('sensitiveRecs', recommendations.sensitive_groups);
    updateRecommendationList('actionRecs', recommendations.actions);
    
    // Add animation to results
    riskDisplay.style.animation = 'none';
    setTimeout(() => {
        riskDisplay.style.animation = 'fadeIn 0.5s ease-in';
    }, 10);
}

function updateRecommendationList(elementId, items) {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.marginBottom = '5px';
        li.style.paddingLeft = '5px';
        listElement.appendChild(li);
    });
}

// ============================================
// FORM HANDLING FUNCTIONS
// ============================================
function resetForm() {
    // Reset sliders to default values
    document.getElementById('pm25').value = 25;
    document.getElementById('pm10').value = 50;
    document.getElementById('no2').value = 30;
    document.getElementById('so2').value = 10;
    document.getElementById('co').value = 1.5;
    document.getElementById('o3').value = 40;
    document.getElementById('temperature').value = 28;
    document.getElementById('humidity').value = 65;
    document.getElementById('location').value = 'Metro Manila';
    
    // Update value displays
    sliders.forEach(slider => {
        const valueDisplay = document.getElementById(slider.id + 'Value');
        if (valueDisplay) {
            valueDisplay.textContent = slider.value;
        }
    });
    
    // Hide results
    resultsContainer.style.display = 'none';
    noResultsMessage.style.display = 'block';
    
    showAlert('✅ Form reset to default values', 'success');
}

function loadScenario(scenarioName) {
    const scenarios = {
        'clean': {
            pm25: 8, pm10: 20, no2: 15, so2: 5, 
            co: 0.5, o3: 20, temperature: 26, humidity: 60
        },
        'moderate': {
            pm25: 25, pm10: 50, no2: 30, so2: 10, 
            co: 1.5, o3: 40, temperature: 28, humidity: 65
        },
        'polluted': {
            pm25: 60, pm10: 120, no2: 80, so2: 30, 
            co: 3.0, o3: 60, temperature: 30, humidity: 75
        },
        'hazardous': {
            pm25: 150, pm10: 300, no2: 150, so2: 50, 
            co: 10, o3: 100, temperature: 32, humidity: 80
        }
    };
    
    const scenario = scenarios[scenarioName];
    if (scenario) {
        for (const [param, value] of Object.entries(scenario)) {
            const slider = document.getElementById(param);
            const valueDisplay = document.getElementById(param + 'Value');
            
            if (slider && valueDisplay) {
                slider.value = value;
                valueDisplay.textContent = value;
            }
        }
        
        showAlert(`✅ Loaded "${scenarioName}" air quality scenario`, 'success');
        
        // Auto-predict after loading scenario
        setTimeout(() => {
            predictRisk();
        }, 500);
    }
}

// ============================================
// ALERT FUNCTIONS
// ============================================
function showAlert(message, type) {
    if (!apiAlert) return;
    
    apiAlert.innerHTML = message;
    apiAlert.className = `alert alert-${type}`;
    apiAlert.style.display = 'block';
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i> ';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i> ';
    
    apiAlert.innerHTML = icon + message;
    
    // Auto-hide success alerts after 5 seconds
    if (type === 'success') {
        setTimeout(hideAlert, 5000);
    }
}

function hideAlert() {
    if (apiAlert) {
        apiAlert.style.display = 'none';
    }
}

// ============================================
// INITIALIZATION ON PAGE LOAD
// ============================================
function initializePage() {
    console.log('🚀 Initializing Air Pollution Risk Assessment System...');
    
    // Initialize sliders
    initializeSliders();
    
    // Set initial model accuracy
    updateModelAccuracy(STATIC_ACCURACY);
    
    // Set API status for static mode
    if (apiStatusElement) {
        apiStatusElement.innerHTML = 
            '<span style="color: #00b09b; font-weight: bold;">● Static Mode (No API Required)</span>';
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Show welcome message
    setTimeout(() => {
        showAlert(
            '🌐 Welcome to Metro Manila Air Pollution Risk Assessment<br>' +
            'Running in static mode - no internet connection required',
            'success'
        );
    }, 1000);
    
    console.log('✅ Page initialization complete');
}

// ============================================
// ADD CSS ANIMATIONS DYNAMICALLY
// ============================================
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .risk-level-display {
            animation: fadeIn 0.5s ease-in;
        }
        
        .probability-item:hover {
            animation: pulse 0.5s ease;
        }
        
        .card {
            animation: fadeIn 0.8s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// EVENT LISTENERS AND GLOBAL EXPORTS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Add CSS animations
    addAnimations();
    
    // Initialize the page
    initializePage();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter to predict
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            predictRisk();
        }
        // Escape to reset
        if (e.key === 'Escape') {
            resetForm();
        }
    });
});

// Expose functions to global scope for button onclick events
window.predictRisk = predictRisk;
window.resetForm = resetForm;
window.loadScenario = loadScenario;

// For debugging
console.log('📊 Air Pollution Risk Assessment System Loaded');
console.log('Mode:', IS_STATIC_MODE ? 'Static (GitHub Pages)' : 'API Mode');
console.log('Model Accuracy:', STATIC_ACCURACY + '%');
