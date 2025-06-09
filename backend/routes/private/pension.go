package private

import (
	"cnr-tp/api"

	"github.com/gin-gonic/gin"
)

func NewPensionRouter(router *gin.RouterGroup, pensionHandler *api.PensionHandler) {
	// Pension routes
	router.GET("/pensions", pensionHandler.GetPensions)
	router.GET("/pensions/:id", pensionHandler.GetPension)
	router.POST("/pensions", pensionHandler.CreatePension)
	router.PUT("/pensions/:id", pensionHandler.UpdatePension)
	router.DELETE("/pensions/:id", pensionHandler.DeletePension)

	// Risk stats route
	router.POST("/pensions/risk-stats", pensionHandler.GetRiskLevelStats)
}
