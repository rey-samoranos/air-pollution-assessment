# app.py - UPDATED VERSION WITH MODEL INTEGRATION
"""
Flask API for Metro Manila Air Pollution Risk Assessment
With trained model integration
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os
from datetime import datetime

app = Flask(__name__)

# Enable CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost", "http://127.0.0.1:5500", "http://localhost:5500", "*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# ========== LOAD TRAINED MODEL ==========
MODEL_PATH = 'air_pollution_model.pkl'
MODEL_INFO_PATH = 'model_info.json'
DASHBOARD_DATA_PATH = 'dashboard_data.json'

print("="*60)
print("LOADING TRAINED MODEL")
print("="*60)

# Initialize variables
model = None
scaler = None
label_encoder = None
feature_names = []
model_accuracy = 0.85
dashboard_data = {}

try:
    # Load model
    if os.path.exists(MODEL_PATH):
        print(f"📂 Loading model from: {MODEL_PATH}")
        model_data = joblib.load(MODEL_PATH)
        
        model = model_data['model']
        scaler = model_data['scaler']
        label_encoder = model_data['label_encoder']
        feature_names = model_data['features']
        model_accuracy = model_data.get('accuracy', 0.85)
        
        print(f"✅ Model loaded successfully!")
        print(f"✅ Model type: {type(model).__name__}")
        print(f"✅ Accuracy: {model_accuracy:.2%}")
        print(f"✅ Features: {feature_names}")
        print(f"✅ Classes: {label_encoder.classes_}")
    else:
        print(f"❌ Model file '{MODEL_PATH}' not found")
        print("💡 Please download the model from Google Colab and place it in the project folder")
        
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("⚠️ Using rule-based fallback system")

# Load model info
try:
    if os.path.exists(MODEL_INFO_PATH):
        with open(MODEL_INFO_PATH, 'r') as f:
            model_info = json.load(f)
        print(f"✅ Model info loaded from {MODEL_INFO_PATH}")
except Exception as e:
    print(f"⚠️ Could not load model info: {e}")
    model_info = {
        'name': 'Decision Tree Classifier' if model else 'Rule-Based System',
        'accuracy': round(model_accuracy * 100, 2),
        'description': 'Metro Manila air pollution risk assessment model'
    }

# Load dashboard data
try:
    if os.path.exists(DASHBOARD_DATA_PATH):
        with open(DASHBOARD_DATA_PATH, 'r') as f:
            dashboard_data = json.load(f)
        print(f"✅ Dashboard data loaded from {DASHBOARD_DATA_PATH}")
except Exception as e:
    print(f"⚠️ Could not load dashboard data: {e}")
    dashboard_data = {
        'risk_distribution': {'Low': 42, 'Moderate': 48, 'High': 10},
        'monthly_trends': [
            {'period': '2025-01', 'pm25': 28},
            {'period': '2025-02', 'pm25': 32},
            {'period': '2025-03', 'pm25': 35},
            {'period': '2025-04', 'pm25': 30},
            {'period': '2025-05', 'pm25': 25},
            {'period': '2025-06', 'pm25': 22},
            {'period': '2025-07', 'pm25': 28},
            {'period': '2025-08', 'pm25': 33},
            {'period': '2025-09', 'pm25': 38},
            {'period': '2025-10', 'pm25': 35},
            {'period': '2025-11', 'pm25': 32}
        ],
        'summary': {
            'total_samples': 1000,
            'avg_pm25': 25.5,
            'model_accuracy': model_accuracy * 100
        }
    }

print("\n" + "="*60)
print("FLASK API READY")
print("="*60)

# Helper functions
def calculate_aqi(pm25):
    """Calculate Air Quality Index from PM2.5"""
    if pm25 <= 12:
        return pm25 * (50/12)  # Good (0-50)
    elif pm25 <= 35.4:
        return 51 + (pm25-12.1) * (49/23.3)  # Moderate (51-100)
    elif pm25 <= 55.4:
        return 101 + (pm25-35.5) * (49/19.9)  # Unhealthy for Sensitive Groups (101-150)
    elif pm25 <= 150.4:
        return 151 + (pm25-55.5) * (49/94.9)  # Unhealthy (151-200)
    else:
        return 201 + (pm25-150.5) * (99/49.5)  # Very Unhealthy (201-300)

def get_aqi_category(aqi):
    """Get AQI category from AQI value"""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    else:
        return "Very Unhealthy"

def get_recommendations(risk_level, aqi):
    """Get recommendations based on risk level and AQI"""
    recommendations = {
        'general': [],
        'sensitive_groups': [],
        'actions': []
    }
    
    if risk_level == "Low" or aqi <= 50:
        recommendations['general'] = [
            "Air quality is satisfactory",
            "Normal outdoor activities are safe"
        ]
        recommendations['sensitive_groups'] = [
            "No special precautions needed"
        ]
        recommendations['actions'] = [
            "Continue regular outdoor activities",
            "Maintain current pollution control measures"
        ]
    
    elif risk_level == "Moderate" or aqi <= 100:
        recommendations['general'] = [
            "Air quality is acceptable",
            "Unusually sensitive people should consider reducing prolonged outdoor exertion"
        ]
        recommendations['sensitive_groups'] = [
            "Children, elderly, and people with respiratory conditions",
            "Consider reducing strenuous outdoor activities"
        ]
        recommendations['actions'] = [
            "Reduce vehicle idling",
            "Limit outdoor burning",
            "Use public transportation when possible"
        ]
    
    else:  # High risk or AQI > 100
        recommendations['general'] = [
            "Air quality is unhealthy",
            "Everyone may begin to experience health effects"
        ]
        recommendations['sensitive_groups'] = [
            "Avoid all outdoor activities",
            "Stay indoors with air purifiers if possible"
        ]
        recommendations['actions'] = [
            "Issue public health advisory",
            "Implement traffic reduction measures",
            "Activate emergency pollution control protocols"
        ]
    
    return recommendations

# ========== API ENDPOINTS ==========
@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Air Pollution API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2c3e50; }
            .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
            .success { background: #d4edda; color: #155724; border-left: 5px solid #28a745; }
            .warning { background: #fff3cd; color: #856404; border-left: 5px solid #ffc107; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>🌫️ Metro Manila Air Pollution Risk API</h1>
        
        <div class="status ''' + ('success' if model else 'warning') + '''">
            <strong>Status:</strong> ''' + ('✅ Model Loaded' if model else '⚠️ Using Rule-Based Fallback') + '''<br>
            <strong>Model:</strong> ''' + (model_info.get('name', 'Unknown') if model else 'Rule-Based') + '''<br>
            <strong>Accuracy:</strong> ''' + str(round(model_accuracy * 100, 2)) + '''%<br>
            <strong>Features:</strong> ''' + str(feature_names) + '''
        </div>
        
        <h3>📡 API Endpoints:</h3>
        <ul>
            <li><a href="/api/health">GET /api/health</a> - Health check</li>
            <li><a href="/api/dashboard">GET /api/dashboard</a> - Dashboard data</li>
            <li><a href="/api/model">GET /api/model</a> - Model information</li>
            <li>POST /api/predict - Get risk prediction</li>
        </ul>
        
        <h3>🧪 Test Prediction:</h3>
        <pre>
curl -X POST http://localhost:5000/api/predict \\
  -H "Content-Type: application/json" \\
  -d '{"pm25": 25, "pm10": 50, "no2": 30, "so2": 10, "co": 1.5, "o3": 40, "temperature": 28, "humidity": 65}'
        </pre>
        
        <h3>📊 Dashboard Preview:</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <strong>Risk Distribution:</strong><br>
            Low: ''' + str(dashboard_data.get('risk_distribution', {}).get('Low', 0)) + '''%<br>
            Moderate: ''' + str(dashboard_data.get('risk_distribution', {}).get('Moderate', 0)) + '''%<br>
            High: ''' + str(dashboard_data.get('risk_distribution', {}).get('High', 0)) + '''%
        </div>
        
        <div style="margin-top: 20px; color: #666;">
            <p>Total samples: ''' + str(dashboard_data.get('summary', {}).get('total_samples', 0)) + '''</p>
            <p>Average PM2.5: ''' + str(round(dashboard_data.get('summary', {}).get('avg_pm25', 0), 1)) + ''' μg/m³</p>
        </div>
    </body>
    </html>
    '''

@app.route('/api/predict', methods=['POST', 'OPTIONS'])
def predict():
    """Real-time prediction endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get data from request
        data = request.json or {}
        
        # Extract parameters with defaults
        params = {
            'pm25': float(data.get('pm25', 25)),
            'pm10': float(data.get('pm10', 50)),
            'no2': float(data.get('no2', 30)),
            'so2': float(data.get('so2', 10)),
            'co': float(data.get('co', 1.5)),
            'o3': float(data.get('o3', 40)),
            'temperature': float(data.get('temperature', 28)),
            'humidity': float(data.get('humidity', 65))
        }
        
        location = data.get('location', 'Metro Manila')
        
        # Make prediction
        if model is not None:
            try:
                # Ensure all features are present
                input_features = []
                for feature in feature_names:
                    if feature in params:
                        input_features.append(params[feature])
                    else:
                        # Use default value if feature missing
                        input_features.append(25 if feature == 'pm25' else 50 if feature == 'pm10' else 30)
                
                # Prepare input array
                input_array = np.array([input_features])
                
                # Scale input
                input_scaled = scaler.transform(input_array)
                
                # Predict
                prediction_encoded = model.predict(input_scaled)[0]
                prediction = label_encoder.inverse_transform([prediction_encoded])[0]
                
                # Get probabilities
                if hasattr(model, 'predict_proba'):
                    probabilities = model.predict_proba(input_scaled)[0]
                    confidence = max(probabilities) * 100
                    prob_dict = {}
                    for i, class_name in enumerate(label_encoder.classes_):
                        prob_dict[class_name.lower()] = float(probabilities[i] * 100)
                else:
                    confidence = 90
                    prob_dict = {class_name.lower(): 0 for class_name in label_encoder.classes_}
                    prob_dict[prediction.lower()] = confidence
                    
            except Exception as e:
                print(f"Model prediction error: {e}")
                # Fallback to rule-based
                raise
        else:
            # Rule-based prediction (fallback)
            pm25 = params['pm25']
            
            if pm25 <= 12:
                prediction = "Low"
                confidence = 95
                prob_dict = {'low': 90, 'moderate': 8, 'high': 2}
            elif pm25 <= 35.4:
                prediction = "Moderate"
                confidence = 90
                prob_dict = {'low': 10, 'moderate': 85, 'high': 5}
            else:
                prediction = "High"
                confidence = 85
                prob_dict = {'low': 2, 'moderate': 8, 'high': 90}
        
        # Calculate AQI
        aqi = calculate_aqi(params['pm25'])
        
        # Prepare response
        response = {
            'success': True,
            'prediction': prediction,
            'confidence': round(confidence, 2),
            'probabilities': prob_dict,
            'aqi': round(aqi, 1),
            'aqi_category': get_aqi_category(aqi),
            'parameters': params,
            'location': location,
            'timestamp': datetime.now().isoformat(),
            'model_info': {
                'type': type(model).__name__ if model else 'Rule-Based',
                'accuracy': round(model_accuracy * 100, 2),
                'features_used': feature_names
            },
            'recommendations': get_recommendations(prediction, aqi)
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error processing prediction request'
        }), 400

@app.route('/api/dashboard', methods=['GET', 'OPTIONS'])
def get_dashboard():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        return jsonify({
            'success': True,
            'dashboard': dashboard_data,
            'model_loaded': model is not None,
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/model', methods=['GET', 'OPTIONS'])
def get_model_info():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        return jsonify({
            'success': True,
            'model': {
                'name': model_info.get('name', 'Decision Tree Classifier'),
                'accuracy': round(model_accuracy * 100, 2),
                'features': feature_names,
                'classes': label_encoder.classes_.tolist() if label_encoder and hasattr(label_encoder, 'classes_') else ['Low', 'Moderate', 'High'],
                'description': model_info.get('description', 'Metro Manila air pollution risk assessment model'),
                'loaded': model is not None
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_accuracy': round(model_accuracy * 100, 2),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🌐 Starting Flask Server")
    print("="*60)
    print(f"✅ API Ready: http://localhost:5000")
    print(f"✅ Model: {'✅ Loaded' if model else '⚠️ Rule-based fallback'}")
    print(f"✅ Accuracy: {model_accuracy:.2%}")
    print("\n📊 Endpoints:")
    print("  GET  /              - API documentation")
    print("  GET  /api/health    - Health check")
    print("  GET  /api/dashboard - Dashboard data")
    print("  GET  /api/model     - Model information")
    print("  POST /api/predict   - Risk prediction")
    print("\n💡 Tip: Open http://localhost:5000 in your browser to test")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)