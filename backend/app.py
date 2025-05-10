
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create directories for uploads and results if they don't exist
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('static/results', exist_ok=True)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Flask backend is running!"})

# Add API endpoints for image processing here

if __name__ == '__main__':
    app.run(debug=True, port=5000)
