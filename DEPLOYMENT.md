# Deployment Guide

## GitHub Pages

The app can be deployed to GitHub Pages via the workflow in [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

### Triggers

- **Push to `main`**: each push to the default branch runs the workflow and deploys.
- **Manual**: run the workflow from the Actions tab (workflow_dispatch).

### URL

The site is served at `https://<owner>.github.io/<repo>/` (e.g. `https://your-org.github.io/systemique/`).

### Setup

1. In the repo: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. After the workflow runs, the site will be available at the URL above.

### Base path

The workflow sets `VITE_BASE_PATH` to `/<repo-name>/` so asset and API URLs work under the GitHub Pages subpath. For local or Docker builds, `VITE_BASE_PATH` is unset and the app uses base `/`.

### SPA fallback

The workflow copies `dist/index.html` to `dist/404.html` so GitHub Pages serves the app for unknown paths (same behavior as the Docker Caddy `try_files` fallback).

## Docker Deployment

### Prerequisites

- Docker (with BuildKit enabled - default in Docker 20.10+)
- Docker Compose

### Build Optimization

The Dockerfile uses BuildKit cache mounts to cache npm packages between builds, significantly reducing build time. The cache is stored in Docker's build cache and persists between builds. This means `npm install` will be much faster on subsequent builds since packages are cached.

### Building and Running with Docker Compose

1. **Build and start the container:**

   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   Open your browser and navigate to `http://localhost:8080`

3. **View logs:**

   ```bash
   docker-compose logs -f
   ```

4. **Stop the container:**

   ```bash
   docker-compose down
   ```

### Building with Docker (without Compose)

1. **Build the image:**

   ```bash
   docker build -t systemique:latest .
   ```

2. **Run the container:**

   ```bash
   docker run -d -p 8080:80 --name systemique systemique:latest
   ```

3. **Stop and remove:**

   ```bash
   docker stop systemique
   docker rm systemique
   ```

### Production Considerations

- The application runs on port 80 inside the container and is exposed on port 8080 by default
- To change the exposed port, modify the `ports` section in `docker-compose.yml`
- For production, consider:
  - Using a reverse proxy (nginx, traefik) in front of the container
  - Setting up SSL/TLS certificates
  - Configuring proper domain names
  - Using environment-specific configurations

### Development vs Production

The Docker setup is optimized for production builds. For development, continue using:

```bash
npm start
```
