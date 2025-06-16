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
	excelDir := "./excel_data"
	log.Printf("Looking for Excel files in directory: %s", excelDir)

	// Check if directory exists
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
				if filepath.Ext(file.Name()) == ".xlsx" || filepath.Ext(file.Name()) == ".xls" {
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
	log.Printf("Opening Excel file: %s", filePath)

	// Check file size
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

	// Get the first sheet
	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return errors.New("no sheets found in the excel file")
	}
	log.Printf("Processing sheet: %s", sheetName)

	// Get all rows from the sheet
	log.Printf("Attempting to read rows from sheet...")
	rows, err := f.GetRows(sheetName)
	if err != nil {
		log.Printf("Error reading rows: %v", err)
		return fmt.Errorf("failed to get rows from sheet %s: %v", sheetName, err)
	}

	if len(rows) < 2 {
		log.Printf("No data rows found. Total rows: %d", len(rows))
		return errors.New("excel file has no data rows (headers only or empty)")
	}
	log.Printf("Found %d rows in sheet (including header)", len(rows))

	// Log the first few rows for debugging
	for i := 0; i < min(3, len(rows)); i++ {
		log.Printf("Row %d: %v", i+1, rows[i])
	}

	successCount := 0
	errorCount := 0

	// Process rows sequentially
	for i, row := range rows {
		if i == 0 { // Skip header
			log.Printf("Skipping header row: %v", row)
			continue
		}

		if len(row) < 16 {
			log.Printf("Skipping row %d due to insufficient columns (found %d, expected 16): %v", i+1, len(row), row)
			errorCount++
			continue
		}

		pensionData := domain.PensionData{}

		// Log the raw data for debugging
		log.Printf("Processing row %d: %v", i+1, row)

		valAG, err := strconv.ParseInt(row[0], 10, 8)
		if err != nil {
			log.Printf("Error parsing AG at row %d: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AG = int8(valAG)

		valAVT, err := strconv.ParseInt(row[1], 10, 8)
		if err != nil {
			log.Printf("Error parsing AVT at row %d: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AVT = int8(valAVT)

		pensionData.NPens = row[2]
		pensionData.EtatPens = row[3]

		// Try to parse dates with both formats
		dateFormats := []string{
			"02/01/2006 15:04:05",
			"2006-01-02 15:04:05",
		}

		var dateErr error
		for _, format := range dateFormats {
			pensionData.DateNais, dateErr = time.Parse(format, row[4])
			if dateErr == nil {
				break
			}
		}
		if dateErr != nil {
			log.Printf("Invalid DateNais format at row %d: %v (value: %s)", i+1, dateErr, row[4])
			errorCount++
			continue
		}

		for _, format := range dateFormats {
			pensionData.DateJouis, dateErr = time.Parse(format, row[5])
			if dateErr == nil {
				break
			}
		}
		if dateErr != nil {
			log.Printf("Invalid DateJouis format at row %d: %v (value: %s)", i+1, dateErr, row[5])
			errorCount++
			continue
		}

		pensionData.SexeTP = row[6]

		pensionData.NetMens, err = strconv.ParseFloat(row[7], 64)
		if err != nil {
			log.Printf("Error parsing NetMens at row %d: %v", i+1, err)
			errorCount++
			continue
		}

		pensionData.TauxD, err = strconv.ParseFloat(row[8], 64)
		if err != nil {
			log.Printf("Error parsing TauxD at row %d: %v", i+1, err)
			errorCount++
			continue
		}

		pensionData.TauxRV, err = strconv.ParseFloat(row[9], 64)
		if err != nil {
			log.Printf("Error parsing TauxRV at row %d: %v", i+1, err)
			errorCount++
			continue
		}

		pensionData.TauxGLB, err = strconv.ParseFloat(row[10], 64)
		if err != nil {
			log.Printf("Error parsing TauxGLB at row %d: %v", i+1, err)
			errorCount++
			continue
		}

		valAgeAppTP, err := strconv.ParseInt(row[11], 10, 8)
		if err != nil {
			log.Printf("Error parsing AgeAppTP at row %d: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AgeAppTP = int8(valAgeAppTP)

		pensionData.DureePension, err = strconv.Atoi(row[12])
		if err != nil {
			log.Printf("Error parsing DureePension at row %d: %v", i+1, err)
			errorCount++
			continue
		}

		valAgeMoyenCat, err := strconv.ParseInt(row[13], 10, 8)
		if err != nil {
			log.Printf("Error parsing AgeMoyenCat at row %d: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.AgeMoyenCat = int8(valAgeMoyenCat)

		valRisqueAge, err := strconv.ParseInt(row[14], 10, 8)
		if err != nil {
			log.Printf("Error parsing RisqueAge at row %d: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.RisqueAge = int8(valRisqueAge)

		valNiveauRisquePredit, err := strconv.ParseInt(row[15], 10, 8)
		if err != nil {
			log.Printf("Error parsing NiveauRisquePredit at row %d: %v", i+1, err)
			errorCount++
			continue
		}
		pensionData.NiveauRisquePredit = int8(valNiveauRisquePredit)

		log.Printf("Inserting row %d: %+v", i+1, pensionData)

		if err := pensionUseCase.CreatePension(&pensionData); err != nil {
			log.Printf("Error inserting pension data from row %d: %v", i+1, err)
			errorCount++
		} else {
			successCount++
		}
	}

	log.Printf("Import completed. Successfully imported %d rows, %d errors", successCount, errorCount)
	return nil
}

// Helper function to get minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
