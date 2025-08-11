#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd backend
npm start &
cd ..

# Start the frontend server
echo "Starting frontend server..."
cd frontend
npm start
