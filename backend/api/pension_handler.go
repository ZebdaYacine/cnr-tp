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
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	pensions, total, err := h.pensionUseCase.GetAllPensions(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pension data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pensions,
		"meta": gin.H{
			"total":  total,
			"page":   page,
			"limit":  limit,
			"offset": (page - 1) * limit,
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
	wilaya := c.Query("wilaya")              // Get wilaya from query parameter
	categories := c.QueryArray("categories") // Get categories from query parameter
	avantages := c.QueryArray("avantages")   // Get avantages from query parameter

	stats, err := h.pensionUseCase.GetRiskLevelStats(wilaya, categories, avantages)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch risk level statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
