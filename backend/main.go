package main

import (
	"cnr-tp/api"
	"cnr-tp/config"
	"cnr-tp/domain"
	"cnr-tp/repository"
	"cnr-tp/routes"
	"cnr-tp/usecase"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database connection
	dsn := cfg.GetDSN()
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto migrate the schema
	if err := db.AutoMigrate(&domain.User{}, &domain.PensionData{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	pensionRepo := repository.NewPensionRepository(db)

	// Initialize use cases
	userUseCase := usecase.NewUserUseCase(userRepo)
	pensionUseCase := usecase.NewPensionUseCase(pensionRepo)

	// Check for Excel files in the mounted directory
	excelDir := "/app/excel_data"
	files, err := os.ReadDir(excelDir)
	if err != nil {
		log.Printf("Warning: Could not read excel directory: %v", err)
	} else {
		for _, file := range files {
			if filepath.Ext(file.Name()) == ".xlsx" || filepath.Ext(file.Name()) == ".xls" {
				excelFilePath := filepath.Join(excelDir, file.Name())
				log.Printf("Found Excel file: %s", excelFilePath)
				err := importPensionDataFromExcel(excelFilePath, pensionUseCase)
				if err != nil {
					log.Printf("Failed to import data from Excel file %s: %v", file.Name(), err)
				} else {
					log.Printf("Successfully imported data from %s", file.Name())
				}
			}
		}
	}

	// Initialize handlers
	userHandler := api.NewUserHandler(userUseCase)
	pensionHandler := api.NewPensionHandler(pensionUseCase)

	// Initialize router
	router := gin.Default()

	// Setup all routes
	routes.Setup(router, userHandler, pensionHandler)

	// Start server
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func importPensionDataFromExcel(filePath string, pensionUseCase domain.PensionUseCase) error {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to open excel file: %v", err)
	}
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("error closing excel file: %v", err)
		}
	}()

	// Get the first sheet
	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return errors.New("no sheets found in the excel file")
	}

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return fmt.Errorf("failed to get rows from sheet %s: %v", sheetName, err)
	}

	if len(rows) < 2 {
		return errors.New("excel file has no data rows (headers only or empty)")
	}

	// Process rows sequentially
	for i, row := range rows {
		if i == 0 { // Skip header
			continue
		}

		if len(row) < 16 {
			log.Printf("Skipping row %d due to insufficient columns: %v", i+1, row)
			continue
		}

		pensionData := domain.PensionData{}

		valAG, _ := strconv.ParseInt(row[0], 10, 8)
		pensionData.AG = int8(valAG)

		valAVT, _ := strconv.ParseInt(row[1], 10, 8)
		pensionData.AVT = int8(valAVT)

		pensionData.NPens = row[2]
		pensionData.EtatPens = row[3]

		pensionData.DateNais, err = time.Parse("2006-01-02 15:04:05", row[4])
		if err != nil {
			log.Printf("Invalid DateNais format at row %d: %v", i+1, err)
			continue
		}

		pensionData.DateJouis, err = time.Parse("2006-01-02 15:04:05", row[5])
		if err != nil {
			log.Printf("Invalid DateJouis format at row %d: %v", i+1, err)
			continue
		}

		pensionData.SexeTP = row[6]

		pensionData.NetMens, _ = strconv.ParseFloat(row[7], 64)
		pensionData.TauxD, _ = strconv.ParseFloat(row[8], 64)
		pensionData.TauxRV, _ = strconv.ParseFloat(row[9], 64)
		pensionData.TauxGLB, _ = strconv.ParseFloat(row[10], 64)

		valAgeAppTP, _ := strconv.ParseInt(row[11], 10, 8)
		pensionData.AgeAppTP = int8(valAgeAppTP)

		pensionData.DureePension, _ = strconv.Atoi(row[12])

		valAgeMoyenCat, _ := strconv.ParseInt(row[13], 10, 8)
		pensionData.AgeMoyenCat = int8(valAgeMoyenCat)

		valRisqueAge, _ := strconv.ParseInt(row[14], 10, 8)
		pensionData.RisqueAge = int8(valRisqueAge)

		valNiveauRisquePredit, _ := strconv.ParseInt(row[15], 10, 8)
		pensionData.NiveauRisquePredit = int8(valNiveauRisquePredit)

		log.Printf("Inserting row %d: %+v", i+1, pensionData)

		if err := pensionUseCase.CreatePension(&pensionData); err != nil {
			log.Printf("Error inserting pension data from row %d: %v", i+1, err)
		}
	}

	return nil
}
