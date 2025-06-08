package public

import (
	"cnr-tp/api"

	"github.com/gin-gonic/gin"
)

func NewAuthRouter(router *gin.RouterGroup, userHandler *api.UserHandler) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", userHandler.Register)
		auth.POST("/login", userHandler.Login)
	}
}
