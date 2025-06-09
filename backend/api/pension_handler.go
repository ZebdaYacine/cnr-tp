package api

import (
	"cnr-tp/domain"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PensionHandler struct {
	pensionUseCase domain.PensionUseCase
}

func NewPensionHandler(pensionUseCase domain.PensionUseCase) *PensionHandler {
	return &PensionHandler{pensionUseCase: pensionUseCase}
}

func (h *PensionHandler) GetPensions(c *gin.Context) {
	pensions, total, err := h.pensionUseCase.GetAllPensions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pension data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pensions,
		"meta": gin.H{
			"total": total,
		},
	})
}

func (h *PensionHandler) GetPension(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	pension, err := h.pensionUseCase.GetPension(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pension data not found"})
		return
	}

	c.JSON(http.StatusOK, pension)
}

func (h *PensionHandler) CreatePension(c *gin.Context) {
	var pension domain.PensionData
	if err := c.ShouldBindJSON(&pension); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.pensionUseCase.CreatePension(&pension); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pension data"})
		return
	}

	c.JSON(http.StatusCreated, pension)
}

func (h *PensionHandler) UpdatePension(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var pension domain.PensionData
	if err := c.ShouldBindJSON(&pension); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pension.ID = uint(id)
	if err := h.pensionUseCase.UpdatePension(&pension); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pension data"})
		return
	}

	c.JSON(http.StatusOK, pension)
}

func (h *PensionHandler) DeletePension(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.pensionUseCase.DeletePension(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pension data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pension data deleted successfully"})
}

// GetRiskLevelStats handles fetching risk level statistics
func (h *PensionHandler) GetRiskLevelStats(c *gin.Context) {
	var filters struct {
		Wilaya     string   `json:"wilaya"`
		Categories []string `json:"categories"`
		Avantages  []string `json:"avantages"`
	}

	// Bind the JSON request body to the filters struct
	if err := c.ShouldBindJSON(&filters); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body format"})
		return
	}

	stats, err := h.pensionUseCase.GetRiskLevelStats(filters.Wilaya, filters.Categories, filters.Avantages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch risk level statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
