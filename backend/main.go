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

	// // Check for Excel files in the mounted directory
	excelDir := "./excel_data"
	log.Printf("Looking for Excel files in directory: %s", excelDir)

	// // Check if directory exists
	if _, err := os.Stat(excelDir); os.IsNotExist(err) {
		log.Printf("Excel directory does not exist: %s", excelDir)
	} else {
		files, err := os.ReadDir(excelDir)
		if err != nil {
			log.Printf("Error reading excel directory: %v", err)
		} else {
			if len(files) == 0 {
				log.Printf("No files found in directory: %s", excelDir)
			} else {
				log.Printf("Found %d files in directory", len(files))
				for _, file := range files {
					log.Printf("Found file: %s", file.Name())
				}
			}

			for _, file := range files {
				// if filepath.Ext(file.Name()) == ".xlsx" || filepath.Ext(file.Name()) == ".xls" {
				excelFilePath := filepath.Join(excelDir, file.Name())
				log.Printf("Processing Excel file: %s", excelFilePath)

				// Check if file exists and is readable
				if _, err := os.Stat(excelFilePath); os.IsNotExist(err) {
					log.Printf("Excel file does not exist: %s", excelFilePath)
					continue
				}

				// Try to open the file first to check permissions
				file, err := os.Open(excelFilePath)
				if err != nil {
					log.Printf("Error opening file %s: %v", excelFilePath, err)
					continue
				}
				file.Close()

				err = importPensionDataFromExcel(excelFilePath, pensionUseCase)
				if err != nil {
					log.Printf("Failed to import data from Excel file %s: %v", file.Name(), err)
				} else {
					log.Printf("Successfully imported data from %s", file.Name())
				}
				// }
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
	log.Printf("Opening Excel file: %s", filePath)

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("failed to get file info: %v", err)
	}
	log.Printf("File size: %d bytes", fileInfo.Size())

	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to open excel file: %v", err)
	}
	defer func() {
		if err := f.Close(); err != nil {
			log.Printf("error closing excel file: %v", err)
		}
	}()

	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return errors.New("no sheets found in the excel file")
	}
	log.Printf("Processing sheet: %s", sheetName)

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return fmt.Errorf("failed to get rows from sheet %s: %v", sheetName, err)
	}

	if len(rows) < 2 {
		return errors.New("excel file has no data rows (headers only or empty)")
	}
	log.Printf("Found %d rows in sheet (including header)", len(rows))

	successCount := 0
	errorCount := 0

	for i, row := range rows {
		if i == 0 { // skip header
			continue
		}

		if len(row) < 16 {
			log.Printf("Row %d: insufficient columns (%d found)", i+1, len(row))
			errorCount++
			continue
		}

		pensionData := domain.PensionData{}

		// Parsing AG (int8)
		valAG, err := strconv.ParseInt(row[0], 10, 8)
		if err != nil {
			log.Printf("Row %d: invalid AG: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AG = int8(valAG)

		// Parsing AVT (string)
		pensionData.AVT = row[1]

		// NPens (string)
		pensionData.NPens = row[2]

		// EtatPens (string)
		pensionData.EtatPens = row[3]

		// DateNais
		pensionData.DateNais, err = time.Parse("2006-01-02 15:04:05", row[4])
		if err != nil {
			log.Printf("Row %d: invalid DateNais: %v", i+1, err)
			errorCount++
			continue
		}

		// DateJouis
		pensionData.DateJouis, err = time.Parse("2006-01-02 15:04:05", row[5])
		if err != nil {
			log.Printf("Row %d: invalid DateJouis: %v", i+1, err)
			errorCount++
			continue
		}

		// SexeTP
		pensionData.SexeTP = row[6]

		// NetMens
		pensionData.NetMens, err = strconv.ParseFloat(row[7], 64)
		if err != nil {
			log.Printf("Row %d: invalid NetMens: %v", i+1, err)
			errorCount++
			continue
		}

		// TauxD
		pensionData.TauxD, err = strconv.ParseFloat(row[8], 64)
		if err != nil {
			log.Printf("Row %d: invalid TauxD: %v", i+1, err)
			errorCount++
			continue
		}

		// TauxRV
		pensionData.TauxRV, err = strconv.ParseFloat(row[9], 64)
		if err != nil {
			log.Printf("Row %d: invalid TauxRV: %v", i+1, err)
			errorCount++
			continue
		}

		// TauxGLB
		pensionData.TauxGLB, err = strconv.ParseFloat(row[10], 64)
		if err != nil {
			log.Printf("Row %d: invalid TauxGLB: %v", i+1, err)
			errorCount++
			continue
		}

		// AgeAppTP (int8)
		valAgeAppTP, err := strconv.ParseInt(row[11], 10, 8)
		if err != nil {
			log.Printf("Row %d: invalid AgeAppTP: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AgeAppTP = int8(valAgeAppTP)

		// DureePension (int)
		pensionData.DureePension, err = strconv.Atoi(row[12])
		if err != nil {
			log.Printf("Row %d: invalid DureePension: %v", i+1, err)
			errorCount++
			continue
		}

		// AgeMoyenCat (int8)
		valAgeMoyenCat, err := strconv.ParseInt(row[13], 10, 8)
		if err != nil {
			log.Printf("Row %d: invalid AgeMoyenCat: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AgeMoyenCat = int8(valAgeMoyenCat)

		// RisqueAge (int8)
		valRisqueAge, err := strconv.ParseInt(row[14], 10, 8)
		if err != nil {
			log.Printf("Row %d: invalid RisqueAge: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.RisqueAge = int8(valRisqueAge)

		// NiveauRisquePredit (int8)
		valNiveauRisquePredit, err := strconv.ParseInt(row[15], 10, 8)
		if err != nil {
			log.Printf("Row %d: invalid NiveauRisquePredit: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.NiveauRisquePredit = int8(valNiveauRisquePredit)

		// Insert into DB
		if err := pensionUseCase.CreatePension(&pensionData); err != nil {
			log.Printf("Row %d: insert error: %v", i+1, err)
			errorCount++
			continue
		}

		successCount++
	}

	log.Printf("Import finished: %d rows inserted, %d errors", successCount, errorCount)
	return nil
}

// Helper function to get minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
