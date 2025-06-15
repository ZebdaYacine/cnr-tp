# Dockerfile for the Go backend
FROM golang:1.23.10-alpine

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application
RUN go build -o main .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the executable
CMD ["./main"] 