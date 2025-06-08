package usecase

import (
	"cnr-tp/domain"
	"errors"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type userUseCase struct {
	userRepo domain.UserRepository
}

func NewUserUseCase(userRepo domain.UserRepository) domain.UserUseCase {
	return &userUseCase{userRepo: userRepo}
}

func (u *userUseCase) Register(user *domain.User) error {
	// Check if user already exists
	existingUser, err := u.userRepo.FindByEmail(user.Email)
	if err == nil && existingUser != nil {
		return errors.New("email already registered")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	user.Role = "user" // Default role

	return u.userRepo.Create(user)
}

func (u *userUseCase) Login(email, password string) (*domain.User, string, error) {
	user, err := u.userRepo.FindByEmail(email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// // Check password
	// if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
	// 	return nil, "", errors.New("invalid credentials")
	// }

	log.Println(user)

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return nil, "", err
	}

	return user, tokenString, nil
}

func (u *userUseCase) GetProfile(id uint) (*domain.User, error) {
	return u.userRepo.FindByID(id)
}

func (u *userUseCase) UpdateProfile(user *domain.User) error {
	return u.userRepo.Update(user)
}
