# Slack Connect: A Full-Stack Messaging Application

Welcome to Slack Connect! This is a full-stack application designed to demonstrate a robust integration with the Slack API. It allows users to securely connect their Slack workspace, send messages to public channels in real-time, and schedule messages for future delivery.

This project was built to showcase a comprehensive understanding of modern web development practices, including full-stack development with TypeScript, secure OAuth 2.0 integration, and reliable background task scheduling.

## Core Features

*   **Secure Slack Authentication:** Implements the complete OAuth 2.0 authorization code flow to securely connect to a user's Slack workspace.
*   **Robust Token Management:** Securely stores both access and refresh tokens. It also includes a proactive token refresh mechanism to ensure the application remains connected without requiring user re-authentication.
*   **Real-Time Messaging:** Allows users to send messages to any public channel in their connected workspace instantly.
*   **Advanced Message Scheduling:** Provides the ability to schedule messages for a specific future date and time.
*   **Scheduled Message Dashboard:** Displays a clean, real-time list of all currently scheduled messages, with the option to cancel any message before it's sent.

## Technology Stack

*   **Frontend:** A modern, responsive single-page application built with **React** and **TypeScript**.
*   **Backend:** A powerful and scalable server built with **Node.js**, **Express**, and **TypeScript**.
*   **Persistence:** A lightweight and efficient **`lowdb`** (JSON file) database for storing authentication tokens and scheduled messages.
*   **Scheduling:** The reliable **`node-schedule`** library for managing and executing background jobs for scheduled messages.

## Architectural Overview

The application follows a classic client-server architecture, with a clear separation of concerns between the frontend and backend.

### Frontend (Client)

The frontend is responsible for the user experience. It provides a simple and intuitive interface for:
1.  Initiating the Slack connection via the OAuth 2.0 flow.
2.  Composing and sending messages.
3.  Scheduling messages for a future time.
4.  Viewing and managing the list of scheduled messages.

It communicates with the backend via a well-defined REST API.

### Backend (Server)

The backend is the core of the application, handling all the business logic and communication with the Slack API. Its key responsibilities include:

*   **OAuth 2.0 and Token Management:** The backend manages the entire OAuth 2.0 flow, from redirecting the user to Slack to handling the callback and exchanging the authorization code for an access token and a refresh token. It securely stores these tokens and uses the refresh token to automatically obtain a new access token whenever the old one expires. This ensures a seamless user experience.
*   **API Endpoints:** It exposes a set of REST API endpoints for the frontend to consume. These endpoints allow the frontend to send messages, schedule messages, and manage the scheduled message queue.
*   **Message Scheduling Service:** The backend runs a persistent background job using `node-schedule`. This job checks every minute for any scheduled messages that are due to be sent, and if so, dispatches them to the appropriate Slack channel using the stored authentication token.

## Setup and Installation

Follow these steps to get the application running locally on your machine.

### Prerequisites

*   Node.js (v14 or later)
*   npm (or your favorite package manager)
*   A Slack workspace where you have permission to install apps.
*   `ngrok` for exposing your local server to the internet.

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/slack-connect-app.git
    cd slack-connect-app
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

### Configuration

1.  **Create Your Slack App:**
    *   Go to [https://api.slack.com/apps](https://api.slack.com/apps) and create a new app from scratch.
    *   Under "OAuth & Permissions", add the following scopes:
        *   **Bot Token Scopes:** `chat:write`, `channels:read`, `team:read`
        *   **User Token Scopes:** `users:read`
    *   You will need your **Client ID** and **Client Secret** from the "Basic Information" page.

2.  **Set Up `ngrok`:**
    *   Follow the instructions on the `ngrok` website to install and authenticate `ngrok`.
    *   Claim a static domain for your `ngrok` account. This will give you a permanent URL for your local server.

3.  **Configure Environment Variables:**
    *   Create a `.env` file in the `backend` directory.
    *   Add your Slack credentials to this file:
        ```
        SLACK_CLIENT_ID='YOUR_SLACK_CLIENT_ID'
        SLACK_CLIENT_SECRET='YOUR_SLACK_CLIENT_SECRET'
        ```

### Running the Application

1.  **Start `ngrok`:**
    *   In a new terminal, start `ngrok` with your static domain, pointing to your local backend port (3001):
        ```bash
        ngrok http --domain=your-static-domain.ngrok-free.app 3001
        ```

2.  **Update Your Slack App's Redirect URI:**
    *   In your Slack app's "OAuth & Permissions" settings, set your Redirect URI to your `ngrok` URL, followed by `/auth/slack/callback`.
        *   Example: `https://your-static-domain.ngrok-free.app/auth/slack/callback`

3.  **Start the Application:**
    *   In the root directory of the project, run the startup script:
        ```bash
        ./start.sh
        ```

4.  **Connect and Use the App:**
    *   Open your browser and navigate to `https://localhost:3000`.
    *   Click the "Connect to Slack" button and authorize the application.

## Challenges & Learnings

This project was a fantastic learning experience, with several interesting challenges that helped solidify my understanding of full-stack development and API integration.

*   **Mastering the OAuth 2.0 Flow:** The OAuth 2.0 flow is complex, and getting it right—especially the token refresh logic—was a key challenge. I learned the importance of carefully reading the API documentation and understanding the difference between user and bot tokens.
*   **Debugging the "Connection Reset" Error:** We encountered a persistent "Connection reset" error that was difficult to diagnose. Through systematic debugging, we discovered that it was caused by a race condition in our database handling. This was a great lesson in the importance of robust state management and proper database initialization.
*   **ES Module Conversion:** Migrating the backend from CommonJS to modern ES modules was a valuable experience. It required a deep dive into TypeScript's module resolution settings and the intricacies of `package.json` configuration.
*   **The `ngrok` HTTPS Requirement:** We learned that for local development, a simple `localhost` setup is often not enough. Using `ngrok` to provide a secure, public URL for the Slack API to communicate with was a crucial step in getting the application to work correctly.

Overall, this project was a great opportunity to build a real-world application from scratch, and I'm proud of the result.
