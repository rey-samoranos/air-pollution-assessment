// Extract all JavaScript from your HTML <script> tags
// API Configuration - Use mock data for static version
const API_BASE_URL = null; // No API for static version

// DOM Elements
const sliders = document.querySelectorAll('input[type="range"]');
const valueDisplays = {};
const apiAlert = document.getElementById('apiAlert');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsContainer = document.getElementById('resultsContainer');
const noResultsMessage = document.getElementById('noResultsMessage');
const modelAccuracyElement = document.getElementById('modelAccuracy');

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

// Function to update model accuracy display
function updateModelAccuracy(accuracy) {
    if (modelAccuracyElement) {
        modelAccuracyElement.textContent = `${accuracy.toFixed(1)}%`;
    }
}

// On page load
window.addEventListener('load', function() {
    // Set model accuracy
    updateModelAccuracy(85.0);
    
    // Load dashboard data
    loadDashboardData();
    
    // Update API status for static version
    document.getElementById('apiStatus').innerHTML = 
        '<span style="color: #00b09b; font-weight: bold;">● Static Mode</span>';
    
    showAlert('🌐 Running in static mode. Predictions use offline calculations.', 'success');
});

// Load dashboard data from JSON file
async function loadDashboardData() {
    try {
        const response = await fetch('data/dashboard_data.json');
        const data = await response.json();
        updateCharts(data);
    } catch (error) {
        console.warn('Using fallback dashboard data:', error);
        updateCharts({
            risk_distribution: {Low: 48.8, Moderate: 49.5, High: 1.6},
            monthly_trends: [
                {period: 'Jan', pm25: 28},
                {period: 'Feb', pm25: 32},
                {period: 'Mar', pm25: 35},
                {period: 'Apr', pm25: 30},
                {period: 'May', pm25: 25},
                {period: 'Jun', pm25: 22},
                {period: 'Jul', pm25: 28},
                {period: 'Aug', pm25: 33},
                {period: 'Sep', pm25: 38},
                {period: 'Oct', pm25: 35},
                {period: 'Nov', pm25: 32}
            ]
        });
    }
}

// Chart functions (copy from your original script)
function updateCharts(dashboardData) {
    // Same chart code as before...
}

// Prediction function for static version
function predictRisk() {
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
    
    // Simulate API delay
    setTimeout(() => {
        loadingSpinner.style.display = 'none';
        
        // Use offline prediction
        showMockResults(formData);
        
        showAlert('✅ Prediction complete (offline mode)', 'success');
    }, 1000);
}

// Mock results function (copy from your original)
function showMockResults(formData) {
    // Same mock results code as before...
}

// Other helper functions (resetForm, showAlert, hideAlert, etc.)
// Copy all other functions from your original script...
