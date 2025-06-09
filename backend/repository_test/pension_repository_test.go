package repository_test

import (
	"cnr-tp/config"
	"cnr-tp/domain"
	"cnr-tp/repository"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestGetRiskLevelStats(t *testing.T) {
	// Load configuration
	cfg, err := config.LoadConfig()
	assert.NoError(t, err, "Failed to load configuration")

	// Initialize database connection using MySQL
	db, err := gorm.Open(mysql.Open(cfg.GetDSN()), &gorm.Config{})
	assert.NoError(t, err, "Failed to connect to MySQL database")

	// Drop and re-create table for a clean test environment
	// db.Migrator().DropTable(&domain.PensionData{})
	// Migrate the schema
	// err = db.AutoMigrate(&domain.PensionData{})
	// assert.NoError(t, err)

	// Initialize repository
	pensionRepo := repository.NewPensionRepository(db)

	// // Create mock pension data
	// pensions := []domain.PensionData{
	// 	{AG: 1, AVT: 1, NPens: "P1", EtatPens: "décès", DateNais: time.Now(), DateJouis: time.Now(), SexeTP: "M", NetMens: 1000, TauxD: 10, TauxRV: 5, TauxGLB: 15, AgeAppTP: 60, DureePension: 10, AgeMoyenCat: 65, RisqueAge: 1, NiveauRisquePredit: 0, Wilaya: "Algiers"},
	// 	{AG: 1, AVT: 1, NPens: "P2", EtatPens: "fin droit", DateNais: time.Now(), DateJouis: time.Now(), SexeTP: "F", NetMens: 1200, TauxD: 12, TauxRV: 6, TauxGLB: 18, AgeAppTP: 55, DureePension: 12, AgeMoyenCat: 60, RisqueAge: 0, NiveauRisquePredit: 0, Wilaya: "Algiers"},
	// 	{AG: 1, AVT: 1, NPens: "P3", EtatPens: "révision", DateNais: time.Now(), DateJouis: time.Now(), SexeTP: "M", NetMens: 1500, TauxD: 15, TauxRV: 7, TauxGLB: 22, AgeAppTP: 70, DureePension: 15, AgeMoyenCat: 75, RisqueAge: 2, NiveauRisquePredit: 1, Wilaya: "Oran"},
	// 	{AG: 1, AVT: 1, NPens: "P4", EtatPens: "décès", DateNais: time.Now(), DateJouis: time.Now(), SexeTP: "F", NetMens: 900, TauxD: 9, TauxRV: 4, TauxGLB: 13, AgeAppTP: 62, DureePension: 8, AgeMoyenCat: 68, RisqueAge: 1, NiveauRisquePredit: 2, Wilaya: "Algiers"},
	// 	{AG: 1, AVT: 1, NPens: "P5", EtatPens: "fin droit", DateNais: time.Now(), DateJouis: time.Now(), SexeTP: "M", NetMens: 1100, TauxD: 11, TauxRV: 5, TauxGLB: 16, AgeAppTP: 58, DureePension: 11, AgeMoyenCat: 63, RisqueAge: 0, NiveauRisquePredit: 1, Wilaya: "Oran"},
	// }

	// for _, p := range pensions {
	// 	err := pensionRepo.Create(&p)
	// 	assert.NoError(t, err)
	// }

	// Test case 1: Get all risk level stats (no wilaya filter)
	stats, err := pensionRepo.GetRiskLevelStats("", []string{}, []string{})
	// assert.NoError(t, err)
	// assert.Len(t, stats, 3)

	// Helper to find stat by risk level
	findStat := func(s []domain.RiskLevelStats, level string) *domain.RiskLevelStats {
		for i := range s {
			if s[i].RiskLevel == level {
				return &s[i]
			}
		}
		return nil
	}

	basRisque := findStat(stats, "Bas risque")
	assert.NotNil(t, basRisque)
	assert.Equal(t, 2, basRisque.Count)
	assert.InDelta(t, 40.0, basRisque.Percentage, 0.01)

	moyenRisque := findStat(stats, "Moyen risque")
	assert.NotNil(t, moyenRisque)
	assert.Equal(t, 2, moyenRisque.Count)
	assert.InDelta(t, 40.0, moyenRisque.Percentage, 0.01)

	hautRisque := findStat(stats, "Haut risque")
	assert.NotNil(t, hautRisque)
	assert.Equal(t, 1, hautRisque.Count)
	assert.InDelta(t, 20.0, hautRisque.Percentage, 0.01)

	// Test case 2: Get risk level stats for a specific wilaya (Algiers)
	statsAlgiers, err := pensionRepo.GetRiskLevelStats("Algiers", []string{}, []string{})
	assert.NoError(t, err)
	assert.Len(t, statsAlgiers, 2)

	basRisqueAlgiers := findStat(statsAlgiers, "Bas risque")
	assert.NotNil(t, basRisqueAlgiers)
	assert.Equal(t, 2, basRisqueAlgiers.Count)
	assert.InDelta(t, 66.66, basRisqueAlgiers.Percentage, 0.01)

	hautRisqueAlgiers := findStat(statsAlgiers, "Haut risque")
	assert.NotNil(t, hautRisqueAlgiers)
	assert.Equal(t, 1, hautRisqueAlgiers.Count)
	assert.InDelta(t, 33.33, hautRisqueAlgiers.Percentage, 0.01)

	// Test case 3: Get risk level stats for a specific wilaya (Oran)
	statsOran, err := pensionRepo.GetRiskLevelStats("Oran", []string{}, []string{})
	assert.NoError(t, err)
	assert.Len(t, statsOran, 2)

	moyenRisqueOran := findStat(statsOran, "Moyen risque")
	assert.NotNil(t, moyenRisqueOran)
	assert.Equal(t, 1, moyenRisqueOran.Count)
	assert.InDelta(t, 50.0, moyenRisqueOran.Percentage, 0.01)

	hautRisqueOran := findStat(statsOran, "Haut risque")
	assert.NotNil(t, hautRisqueOran)
	assert.Equal(t, 1, hautRisqueOran.Count)
	assert.InDelta(t, 50.0, hautRisqueOran.Percentage, 0.01)

	// Test case 4: Get risk level stats for a non-existent wilaya
	statsNonExistent, err := pensionRepo.GetRiskLevelStats("NonExistent", []string{}, []string{})
	assert.NoError(t, err)
	assert.Len(t, statsNonExistent, 0)
}
