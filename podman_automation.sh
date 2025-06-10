#!/bin/zsh
# Podman automation script for OfficeCubicleBooker
# Usage: ./podman-automation.sh [start|stop|clean|logs]

APP_IMAGE=officecubiclebooker
DB_CONTAINER=officecubiclebooker-db
APP_CONTAINER=officecubiclebooker-app

# # Install seatmap library dependency if needed
# echo "Installing react-svg-seatmap dependency..."
# npm install react-svg-seatmap



# Build the app image
echo "Building app image... (Always rebuild after frontend changes to avoid missing index.html)"
podman build -t $APP_IMAGE .

case "$1" in
  start)
    echo "Starting PostgreSQL container..."
    podman run --name $DB_CONTAINER \
      -e POSTGRES_USER=officebooker \
      -e POSTGRES_PASSWORD=officebookerpass \
      -e POSTGRES_DB=officecubicle \
      -p 5432:5432 \
      -d docker.io/postgres:16-alpine
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    for i in {1..30}; do
      podman exec $DB_CONTAINER pg_isready -U officebooker -d officecubicle && break
      sleep 1
    done
    echo "Starting app container..."
    podman run --name $APP_CONTAINER \
      --env-file .env \
      -e "DATABASE_URL=postgres://officebooker:officebookerpass@localhost:5432/officecubicle?sslmode=disable" \
      -p 3000:3000 \
      --network=host \
      -d $APP_IMAGE

    # Install react-select and react-icons inside the app container


    echo "Running database migrations with tsx..."
    podman exec $APP_CONTAINER npx tsx node_modules/.bin/drizzle-kit push --config=drizzle.config.ts
    podman restart officecubiclebooker-app
    echo "App running at http://localhost:3000"
    ;;
  stop)
    echo "Stopping containers..."
    podman stop $APP_CONTAINER $DB_CONTAINER
    ;;
  clean)
    echo "Removing containers..."
    podman rm $APP_CONTAINER $DB_CONTAINER
    echo "Pruning unused podman resources..."
    podman system prune -a -f
    ;;
  logs)
    echo "App logs:"
    podman logs $APP_CONTAINER
    ;;
  *)
    echo "Usage: $0 [start|stop|clean|logs]"
    ;;
esac

