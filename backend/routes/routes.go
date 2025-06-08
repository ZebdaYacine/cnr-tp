package routes

import (
	"cnr-tp/api"
	"cnr-tp/middleware"
	"cnr-tp/routes/private"
	"cnr-tp/routes/public"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Setup configures all routes for the application
func Setup(router *gin.Engine, userHandler *api.UserHandler, pensionHandler *api.PensionHandler) {
	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	config.ExposeHeaders = []string{"Content-Length"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	// Health check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// API routes group
	apiGroup := router.Group("/api/v1")
	{
		// Public routes
		public.NewAuthRouter(apiGroup, userHandler)

		// User routes with middleware
		userRouter := apiGroup.Group("/user")
		userRouter.Use(middleware.AuthMiddleware())
		{
			private.NewUserRouter(userRouter, userHandler)
			private.NewPensionRouter(userRouter, pensionHandler)
		}

		// Admin routes with middleware
		adminRouter := apiGroup.Group("/admin")
		// adminRouter.Use(middleware.AuthMiddleware())
		{
			private.NewUserRouter(adminRouter, userHandler)
			private.NewPensionRouter(adminRouter, pensionHandler)
		}
	}
}
