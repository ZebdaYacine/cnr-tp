package domain

import "time"

type PensionData struct {
	ID                 uint      `json:"id"`
	AG                 int8      `json:"ag"`
	AVT                int8      `json:"avt"`
	NPens              string    `json:"npens"`
	EtatPens           string    `json:"etatpens"`
	DateNais           time.Time `json:"datenais"`
	DateJouis          time.Time `json:"datjouis"`
	SexeTP             string    `json:"sexe_tp"`
	NetMens            float64   `json:"net_mens"`
	TauxD              float64   `json:"taux_d"`
	TauxRV             float64   `json:"taux_rv"`
	TauxGLB            float64   `json:"taux_glb"`
	AgeAppTP           int8      `json:"age_app_tp"`
	DureePension       int       `json:"duree_pension"`
	AgeMoyenCat        int8      `json:"age_moyen_cat"`
	RisqueAge          int8      `json:"risque_age"`
	NiveauRisquePredit int8      `json:"niveau_risque_predit"`
	Wilaya             string    `json:"wilaya"`
}

type PensionRepository interface {
	Create(pension *PensionData) error
	FindByID(id uint) (*PensionData, error)
	FindAll(page, limit int) ([]PensionData, int64, error)
	Update(pension *PensionData) error
	Delete(id uint) error
	GetRiskLevelStats(wilaya string) ([]RiskLevelStats, error)
}

type PensionUseCase interface {
	CreatePension(pension *PensionData) error
	GetPension(id uint) (*PensionData, error)
	GetAllPensions(page, limit int) ([]PensionData, int64, error)
	UpdatePension(pension *PensionData) error
	DeletePension(id uint) error
	GetRiskLevelStats(wilaya string) ([]RiskLevelStats, error)
}

type RiskLevelStats struct {
	RiskLevel  string  `json:"riskLevel"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}
