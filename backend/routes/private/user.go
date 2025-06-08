package private

import (
	"cnr-tp/api"

	"github.com/gin-gonic/gin"
)

func NewUserRouter(router *gin.RouterGroup, userHandler *api.UserHandler) {
	// Profile routes
	router.GET("/profile", userHandler.GetProfile)
	router.PUT("/profile", userHandler.UpdateProfile)
}
