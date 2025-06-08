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

func (r *pensionRepository) FindAll(page, limit int) ([]domain.PensionData, int64, error) {
	var pensions []domain.PensionData
	var total int64

	offset := (page - 1) * limit

	err := r.db.Model(&domain.PensionData{}).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	err = r.db.Offset(offset).Limit(limit).Find(&pensions).Error
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
