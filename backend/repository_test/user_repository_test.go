package repository_test

import (
	"cnr-tp/config"
	"cnr-tp/domain"
	"cnr-tp/repository"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestUserRepository_FindByEmail(t *testing.T) {
	// Load configuration
	cfg, err := config.LoadConfig()
	assert.NoError(t, err, "Failed to load configuration")

	// Initialize database connection using MySQL
	db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{})
	assert.NoError(t, err, "Failed to connect to MySQL database")

	// Auto migrate to ensure table exists
	err = db.AutoMigrate(&domain.User{})
	assert.NoError(t, err, "Failed to auto migrate user schema")

	// Initialize repository
	repo := repository.NewUserRepository(db)

	// Clean up before test
	// db.Exec("DELETE FROM users")

	// Create test users
	user1 := &domain.User{Name: "Test User 1", Email: "test1@example.com", Password: "password123", Role: "user"}
	user2 := &domain.User{Name: "Test User 2", Email: "test2@example.com", Password: "password456", Role: "admin"}

	err = repo.Create(user1)
	assert.NoError(t, err, "Failed to create user 1")

	err = repo.Create(user2)
	assert.NoError(t, err, "Failed to create user 2")

	// Test: find non-existent user
	user, err := repo.FindByEmail("admin@gmail.com")
	assert.Error(t, err, "Expected error when user not found")
	assert.Nil(t, user, "Expected nil user when user not found")

	// Test: find existing user
	user, err = repo.FindByEmail("test1@example.com")
	assert.NoError(t, err, "Failed to find existing user")
	assert.NotNil(t, user, "User should not be nil")
	assert.Equal(t, "test1@example.com", user.Email)
	assert.Equal(t, "password123", user.Password)

	// Clean up after test
	// db.Exec("DELETE FROM users")
}
