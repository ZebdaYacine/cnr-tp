package domain

import "time"

type User struct {
	ID        uint      `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
}

type UserRepository interface {
	Create(user *User) error
	FindByEmail(email string) (*User, error)
	FindByID(id uint) (*User, error)
	Update(user *User) error
	Delete(id uint) error
}

type UserUseCase interface {
	Register(user *User) error
	Login(email, password string) (*User, string, error)
	GetProfile(id uint) (*User, error)
	UpdateProfile(user *User) error
}
