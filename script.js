    // API Configuration
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // DOM Elements
    const sliders = document.querySelectorAll('input[type="range"]');
    const valueDisplays = {};
    const apiAlert = document.getElementById('apiAlert');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsContainer = document.getElementById('resultsContainer');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const modelAccuracyElement = document.getElementById('modelAccuracy'); // ADD THIS
    
    // Initialize slider value displays
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
    
    // Initialize charts
    let riskDistributionChart = null;
    let monthlyTrendsChart = null;
    
    // Function to update model accuracy display - NEW FUNCTION
    function updateModelAccuracy(accuracy) {
        if (modelAccuracyElement) {
            modelAccuracyElement.textContent = `${accuracy.toFixed(1)}%`;
            
            // Optional: Add color coding based on accuracy
            if (accuracy >= 90) {
                modelAccuracyElement.style.color = '#00ff88';
            } else if (accuracy >= 80) {
                modelAccuracyElement.style.color = '#f9d423';
            } else {
                modelAccuracyElement.style.color = '#ff416c';
            }
        }
    }
    
    // Check API health on load
    window.addEventListener('load', function() {
        // Set initial state
        updateModelAccuracy(85.0); // Default to 85% while loading
        
        // Load all data
        checkApiHealth();
        loadDashboardData();
        loadModelInfo();
    });
    
    // Function to check API health
    async function checkApiHealth() {
        const apiStatus = document.getElementById('apiStatus');
        
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'healthy') {
                apiStatus.innerHTML = '<span style="color: #00b09b; font-weight: bold;">● Connected</span>';
                
                // Update model accuracy from health endpoint
                if (data.model_accuracy !== undefined) {
                    updateModelAccuracy(data.model_accuracy);
                }
                
                hideAlert();
                return true;
            } else {
                apiStatus.innerHTML = '<span style="color: #ff416c; font-weight: bold;">● API Error</span>';
                return false;
            }
        } catch (error) {
            console.error('API health check failed:', error);
            apiStatus.innerHTML = '<span style="color: #ff416c; font-weight: bold;">● Disconnected</span>';
            
            if (error.message.includes('Failed to fetch')) {
                showAlert(
                    '⚠️ Cannot connect to Flask API. Using offline mode.<br><br>' +
                    'To connect:<br>' +
                    '1. Open Terminal/CMD<br>' +
                    '2. Run: python app.py<br>' +
                    '3. Refresh this page',
                    'error'
                );
            }
            
            // Keep 85% as fallback
            updateModelAccuracy(85.0);
            return false;
        }
    }
    
    // Function to load dashboard data
    async function loadDashboardData() {
        try {
            const response = await fetch(`${API_BASE_URL}/dashboard`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                updateCharts(data.dashboard);
                
                // Update accuracy from dashboard if available
                if (data.dashboard.summary && data.dashboard.summary.model_accuracy) {
                    updateModelAccuracy(data.dashboard.summary.model_accuracy);
                }
            }
        } catch (error) {
            console.warn('Dashboard data load failed:', error);
            // Use fallback data with YOUR actual percentages
            updateCharts({
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
                ]
            });
        }
    }
    
    // Function to load model info
    async function loadModelInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/model`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.model) {
                // Use the actual accuracy from your model
                const accuracy = data.model.accuracy || 85.0;
                updateModelAccuracy(accuracy);
                
                console.log(`✅ Model: ${data.model.name}, Accuracy: ${accuracy}%`);
            } else {
                console.warn('Model info not available, using 85% accuracy');
                updateModelAccuracy(85.0);
            }
        } catch (error) {
            console.warn('Model info load failed:', error);
            updateModelAccuracy(85.0);
        }
    }
    
    // Function to update charts
    function updateCharts(dashboardData) {
        // Risk Distribution Chart (Pie)
        const riskCtx = document.getElementById('riskDistributionChart').getContext('2d');
        
        if (riskDistributionChart) {
            riskDistributionChart.destroy();
        }
        
        const riskLabels = Object.keys(dashboardData.risk_distribution || {Low: 48.8, Moderate: 49.5, High: 1.6});
        const riskData = Object.values(dashboardData.risk_distribution || {Low: 48.8, Moderate: 49.5, High: 1.6});
        const riskColors = ['#00b09b', '#f9d423', '#ff416c'];
        
        riskDistributionChart = new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: riskLabels,
                datasets: [{
                    data: riskData,
                    backgroundColor: riskColors,
                    borderWidth: 2,
                    borderColor: '#fff'
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
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                },
                cutout: '65%'
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
                    pointRadius: 5
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
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'PM2.5 (μg/m³)'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        });
    }
    
    // Main prediction function
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
        
        try {
            // Call prediction API
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Hide loading spinner
            loadingSpinner.style.display = 'none';
            
            if (data.success) {
                // Show results
                noResultsMessage.style.display = 'none';
                resultsContainer.style.display = 'block';
                
                // Update UI with results
                updateResultsDisplay(data);
                showAlert('✅ Risk assessment completed successfully!', 'success');
            } else {
                showAlert(`❌ Error: ${data.message || 'Unknown error'}`, 'error');
            }
            
        } catch (error) {
            loadingSpinner.style.display = 'none';
            console.error('Prediction error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                showAlert('🌐 API unavailable. Using offline prediction mode.', 'error');
            } else {
                showAlert(`❌ API Error: ${error.message}`, 'error');
            }
            
            // Fallback: Show mock results
            showMockResults(formData);
        }
    }
    
    // Function to update UI with prediction results
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
        } else if (riskLevel === 'Moderate') {
            riskDisplay.classList.add('risk-moderate');
        } else {
            riskDisplay.classList.add('risk-high');
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
    }
    
    // Helper to update recommendation lists
    function updateRecommendationList(elementId, items) {
        const listElement = document.getElementById(elementId);
        listElement.innerHTML = '';
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listElement.appendChild(li);
        });
    }
    
    // Fallback function to show mock results (when API is not available)
    function showMockResults(formData) {
        noResultsMessage.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Calculate mock risk based on PM2.5
        const pm25 = formData.pm25;
        let riskLevel, confidence, aqi;
        
        if (pm25 <= 12) {
            riskLevel = 'Low';
            confidence = 95;
            aqi = pm25 * (50/12);
        } else if (pm25 <= 35.4) {
            riskLevel = 'Moderate';
            confidence = 90;
            aqi = 51 + (pm25-12.1) * (49/23.3);
        } else {
            riskLevel = 'High';
            confidence = 85;
            aqi = 101 + (pm25-35.5) * (49/19.9);
        }
        
        // Update display with mock data
        const mockData = {
            prediction: riskLevel,
            confidence: confidence,
            aqi: aqi,
            aqi_category: aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy for Sensitive Groups',
            probabilities: {
                low: riskLevel === 'Low' ? 90 : riskLevel === 'Moderate' ? 10 : 5,
                moderate: riskLevel === 'Moderate' ? 85 : riskLevel === 'Low' ? 8 : 10,
                high: riskLevel === 'High' ? 90 : riskLevel === 'Moderate' ? 5 : 2
            },
            recommendations: {
                general: riskLevel === 'Low' ? 
                    ['Air quality is satisfactory', 'Normal outdoor activities are safe'] :
                    riskLevel === 'Moderate' ?
                    ['Air quality is acceptable', 'Unusually sensitive people should consider reducing prolonged outdoor exertion'] :
                    ['Air quality is unhealthy', 'Everyone may begin to experience health effects'],
                sensitive_groups: riskLevel === 'Low' ?
                    ['No special precautions needed'] :
                    riskLevel === 'Moderate' ?
                    ['Children, elderly, and people with respiratory conditions', 'Consider reducing strenuous outdoor activities'] :
                    ['Avoid all outdoor activities', 'Stay indoors with air purifiers if possible'],
                actions: riskLevel === 'Low' ?
                    ['Continue regular outdoor activities', 'Maintain current pollution control measures'] :
                    riskLevel === 'Moderate' ?
                    ['Reduce vehicle idling', 'Limit outdoor burning', 'Use public transportation when possible'] :
                    ['Issue public health advisory', 'Implement traffic reduction measures', 'Activate emergency pollution control protocols']
            }
        };
        
        updateResultsDisplay(mockData);
        showAlert('⚠️ Using offline prediction mode (API unavailable)', 'error');
    }
    
    // Function to reset form
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
        
        // Update value displays
        sliders.forEach(slider => {
            const valueDisplay = document.getElementById(slider.id + 'Value');
            valueDisplay.textContent = slider.value;
        });
        
        // Hide results
        resultsContainer.style.display = 'none';
        noResultsMessage.style.display = 'block';
        
        showAlert('✅ Form reset to default values', 'success');
    }
    
    // Alert functions
    function showAlert(message, type) {
        apiAlert.innerHTML = message; // Changed to innerHTML for line breaks
        apiAlert.className = `alert alert-${type}`;
        apiAlert.style.display = 'block';
        
        // Auto-hide success alerts after 5 seconds
        if (type === 'success') {
            setTimeout(hideAlert, 5000);
        }
    }
    
    function hideAlert() {
        apiAlert.style.display = 'none';
    }
    
    // Expose functions to global scope for button onclick events
    window.predictRisk = predictRisk;
    window.resetForm = resetForm;