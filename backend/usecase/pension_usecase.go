package usecase

import "cnr-tp/domain"

type pensionUseCase struct {
	pensionRepo domain.PensionRepository
}

func NewPensionUseCase(pensionRepo domain.PensionRepository) domain.PensionUseCase {
	return &pensionUseCase{pensionRepo: pensionRepo}
}

func (u *pensionUseCase) CreatePension(pension *domain.PensionData) error {
	return u.pensionRepo.Create(pension)
}

func (u *pensionUseCase) GetPension(id uint) (*domain.PensionData, error) {
	return u.pensionRepo.FindByID(id)
}

func (u *pensionUseCase) GetAllPensions(avantages []string) ([]domain.PensionData, int64, error) {
	return u.pensionRepo.FindAll(avantages)
}

func (u *pensionUseCase) UpdatePension(pension *domain.PensionData) error {
	return u.pensionRepo.Update(pension)
}

func (u *pensionUseCase) DeletePension(id uint) error {
	return u.pensionRepo.Delete(id)
}

func (u *pensionUseCase) GetRiskLevelStats(wilaya string, categories []string, avantages []string) ([]domain.RiskLevelStats, error) {
	return u.pensionRepo.GetRiskLevelStats(wilaya, categories, avantages)
}
