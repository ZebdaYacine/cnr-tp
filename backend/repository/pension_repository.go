package repository

import (
	"cnr-tp/domain"

	"gorm.io/gorm"
)

type pensionRepository struct {
	db *gorm.DB
}

func NewPensionRepository(db *gorm.DB) domain.PensionRepository {
	return &pensionRepository{db: db}
}

func (r *pensionRepository) Create(pension *domain.PensionData) error {
	return r.db.Create(pension).Error
}

func (r *pensionRepository) FindByID(id uint) (*domain.PensionData, error) {
	var pension domain.PensionData
	err := r.db.First(&pension, id).Error
	if err != nil {
		return nil, err
	}
	return &pension, nil
}

func (r *pensionRepository) FindAll() ([]domain.PensionData, int64, error) {
	var pensions []domain.PensionData
	var total int64

	err := r.db.Model(&domain.PensionData{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = r.db.Find(&pensions).Error
	if err != nil {
		return nil, 0, err
	}

	return pensions, total, nil
}

func (r *pensionRepository) Update(pension *domain.PensionData) error {
	return r.db.Save(pension).Error
}

func (r *pensionRepository) Delete(id uint) error {
	return r.db.Delete(&domain.PensionData{}, id).Error
}

func (r *pensionRepository) GetRiskLevelStats(wilaya string, categories []string, avantages []string) ([]domain.RiskLevelStats, error) {
	var stats []domain.RiskLevelStats
	var total int64

	db := r.db.Model(&domain.PensionData{})

	if wilaya != "" {
		db = db.Where("ag = ?", wilaya)
	}

	if len(categories) > 0 {
		db = db.Where("etat_pens IN (?)", categories)
	}

	if len(avantages) > 0 {
		var avtCodes []int8
		includeEmpty := false
		for _, avt := range avantages {
			switch avt {
			case "direct":
				avtCodes = append(avtCodes, 1, 7)
			case "fille majeur":
				avtCodes = append(avtCodes, 4, 9)
			case "(Vide)":
				includeEmpty = true
			}
		}

		if includeEmpty && len(avtCodes) > 0 {
			db = db.Where("avt IN (?) OR avt = 0", avtCodes)
		} else if includeEmpty {
			db = db.Where("avt = 0")
		} else if len(avtCodes) > 0 {
			db = db.Where("avt IN (?)", avtCodes)
		}
	}

	// Get total count for percentage calculation
	err := db.Count(&total).Error
	if err != nil {
		return nil, err
	}

	if total == 0 {
		return []domain.RiskLevelStats{}, nil
	}

	// Group by niveau_risque_predit and calculate counts
	var results []struct {
		NiveauRisquePredit int8  `gorm:"column:niveau_risque_predit"`
		Count              int64 `gorm:"column:count"`
	}

	db = db.Select("niveau_risque_predit, count(*) as count").Group("niveau_risque_predit")
	err = db.Find(&results).Error
	if err != nil {
		return nil, err
	}

	// Map numerical risk levels to string labels and calculate percentages
	for _, res := range results {
		riskLevel := "Unknown Risk"
		switch res.NiveauRisquePredit {
		case 2:
			riskLevel = "Bas risque"
		case 1:
			riskLevel = "Moyen risque"
		case 0:
			riskLevel = "Haut risque"
		}

		percentage := (float64(res.Count) / float64(total)) * 100
		stats = append(stats, domain.RiskLevelStats{
			RiskLevel:  riskLevel,
			Count:      int(res.Count),
			Percentage: percentage,
		})
	}

	return stats, nil
}
