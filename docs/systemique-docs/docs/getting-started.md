# Getting Started

Get Systemique up and running in minutes using Docker Compose.

## Prerequisites

- **Git** - to clone the repository
- **Docker** and **Docker Compose** - for containerized deployment

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd systemique
```

Replace `<repository-url>` with the actual Git repository URL.

### 2. Deploy with Docker Compose

Systemique comes with a ready-to-use Docker Compose configuration. Simply run:

```bash
docker-compose up -d --build
```

This command will:
- Build the Systemique application
- Start the web server in a container
- Make the application available on port 8080

### 3. Access the Application

Once the container is running, open your browser and navigate to:

```
http://localhost:8080
```

You should see the Systemique interface with the component palette on the left and the design canvas in the center.

## Verifying the Installation

The Docker Compose setup includes a health check that verifies the application is running correctly. You can check the container status with:

```bash
docker-compose ps
```

If everything is working, you should see the container status as "healthy".

## Stopping the Application

To stop the application:

```bash
docker-compose down
```

To stop and remove all containers, networks, and volumes:

```bash
docker-compose down -v
```

## Next Steps

Now that Systemique is running, you're ready to create your first system design!

👉 **[Create Your First Diagram →](./your-first-diagram)**
