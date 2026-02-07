#!/bin/bash

# Deployment script for Raffle Platform on Hostinger VPS

echo "🚀 Deploying Raffle Platform..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file from .env.production template"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Stop existing containers
echo -e "${YELLOW}⏹️  Stopping existing containers...${NC}"
docker-compose down

# Pull latest changes (if using git)
# git pull origin main

# Build and start containers
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up -d

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker-compose exec -T raffle-app npx prisma migrate deploy

# Check status
echo -e "${YELLOW}📋 Container status:${NC}"
docker-compose ps

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Application should be running on port 3000${NC}"
echo ""
echo "To view logs: docker-compose logs -f raffle-app"
echo "To stop: docker-compose down"
echo "To restart: docker-compose restart"
