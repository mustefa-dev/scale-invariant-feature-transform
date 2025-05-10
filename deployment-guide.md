
# Deployment Guide

This document provides instructions for deploying both the frontend and backend components of the Computer Vision SIFT application.

## Frontend Deployment

The frontend is a React application built with Vite. You can deploy it to any static site hosting service such as:

- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting
- AWS Amplify

### Steps for Frontend Deployment:

1. Set your backend URL in the `.env.production` file:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Upload the contents of the `dist` directory to your hosting service.

4. For platforms like Netlify or Vercel, you can connect your Git repository and they will automatically build and deploy your application.

## Backend Deployment

The backend is a Flask application that requires Python and the ability to install system libraries for OpenCV. There are several options for deployment:

### Option 1: Traditional VPS or Dedicated Server

1. Set up a server with Python 3.9+ installed
2. Clone the repository
3. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Set up environment variables (create a `.env` file from the example):
   ```
   PORT=5000
   HOST=0.0.0.0
   DEBUG=False
   CORS_ORIGIN=https://your-frontend-domain.com
   ```
6. Start the application with Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:5000 wsgi:app
   ```
7. Set up a reverse proxy with Nginx or Apache and configure SSL

### Option 2: Docker Deployment

1. Make sure Docker is installed on your server
2. Build the Docker image:
   ```bash
   docker build -t cv-sift-api .
   ```
3. Run the container:
   ```bash
   docker run -d -p 5000:5000 -e CORS_ORIGIN=https://your-frontend-domain.com --name cv-sift-app cv-sift-api
   ```
4. For production, consider using Docker Compose for easier management

### Option 3: Cloud Platforms

#### Heroku
1. Create a Heroku account and install the Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```
3. Set environment variables:
   ```bash
   heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
   ```
4. Deploy the application:
   ```bash
   git push heroku main
   ```

#### Google Cloud Run
1. Build and push the Docker image to Google Container Registry:
   ```bash
   gcloud builds submit --tag gcr.io/your-project-id/cv-sift-api
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy cv-sift-service --image gcr.io/your-project-id/cv-sift-api --platform managed --allow-unauthenticated
   ```

## Important Production Considerations

1. **File Storage**: The current implementation stores files locally. For production, consider:
   - Using a cloud storage solution like AWS S3, Google Cloud Storage, or Azure Blob Storage
   - Setting up a shared file system if using multiple application instances

2. **Database**: If you need to store metadata about uploads or results, consider adding a database.

3. **Logging and Monitoring**: Set up proper logging and monitoring for your application.

4. **Security**:
   - Implement rate limiting to prevent abuse
   - Add authentication if needed
   - Use HTTPS for all communications

5. **Scaling**:
   - Computer vision tasks can be CPU intensive
   - Consider auto-scaling options based on load
   - For high-traffic applications, implement a task queue system
