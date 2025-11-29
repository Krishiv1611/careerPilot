# Deployment Guide for CareerPilot

This guide will help you deploy your **CareerPilot** application for free using **Render** (for the Backend) and **Vercel** (for the Frontend), with a persistent **PostgreSQL database** (using **Neon**).

## Prerequisites
1.  **GitHub Account**: Code pushed to GitHub.
2.  **Render Account**: [render.com](https://render.com).
3.  **Vercel Account**: [vercel.com](https://vercel.com).
4.  **Neon Account**: [neon.tech](https://neon.tech) (for the database).

---

## Part 1: Get a Free PostgreSQL Database (Neon)

1.  Go to [neon.tech](https://neon.tech) and sign up (free).
2.  Create a **New Project**.
3.  Give it a name (e.g., `careerpilot-db`).
4.  Once created, you will see a **Connection String** on the dashboard.
    -   It looks like: `postgres://neondb_owner:AbCdEf12345@ep-cool-frog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
    -   **Copy this string.** This is your `DATABASE_URL`.

---

## Part 2: Deploy Backend to Render

1.  **Create a New Web Service**
    - Go to [Render Dashboard](https://dashboard.render.com/).
    - **New +** -> **Web Service**.
    - Connect your `careerPilot` repository.

2.  **Configure**
    - **Name**: `careerpilot-backend`.
    - **Root Directory**: `backend`.
    - **Runtime**: **Docker**.
    - **Instance Type**: **Free**.

3.  **Environment Variables** (Crucial Step!)
    - Add the following keys:
        - `DATABASE_URL`: Paste the **Neon Connection String** you copied in Part 1.
        - `CORS_ORIGINS`: `*` (or your Vercel URL later).
        - `DATABASE_URL`: Paste the **Neon Connection String** you copied in Part 1.
        - `CORS_ORIGINS`: `*` (or your Vercel URL later).
        - `PORT`: `8000`.
        - `SECRET_KEY`: (Generate a random string for JWT).

    > **Note**: API Keys (Google, SerpAPI, Tavily) are now managed **Client-Side** by the user in the application settings. You do **NOT** need to add them here.

4.  **Deploy**
    - Click **Create Web Service**.
    - Wait for the build to finish.
    - **Copy the Backend URL** (e.g., `https://careerpilot-backend.onrender.com`).

---

## Part 3: Deploy Frontend to Vercel

1.  **Import Project**
    - Go to [Vercel Dashboard](https://vercel.com/dashboard).
    - **Add New...** -> **Project**.
    - Import `careerPilot`.

2.  **Configure**
    - **Root Directory**: Edit -> Select `frontend`.

3.  **Environment Variables**
    - **Key**: `VITE_BACKEND_URL`
    - **Value**: Your Render Backend URL (e.g., `https://careerpilot-backend.onrender.com`).

4.  **Deploy**
    - Click **Deploy**.
    - You will get a domain (e.g., `https://careerpilot.vercel.app`).

---

## Part 4: Final Connection

1.  **Update Backend CORS**
    - Go to Render -> Environment.
    - Update `CORS_ORIGINS` to: `https://careerpilot.vercel.app` (your actual Vercel domain).
    - Save.

2.  **Done!**
    - Your app is now live with a real database. Data will persist even if the server restarts.
