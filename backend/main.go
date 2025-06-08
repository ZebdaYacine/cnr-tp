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
	"strconv"
	"sync"
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

	// // Check for Excel file argument
	// if len(os.Args) > 1 {
	// 	excelFilePath := os.Args[1]
	// 	log.Printf("Attempting to import data from Excel file: %s\n", excelFilePath)
	// 	pensionRepo := repository.NewPensionRepository(db)
	// 	pensionUseCase := usecase.NewPensionUseCase(pensionRepo)
	// 	err := importPensionDataFromExcel(excelFilePath, pensionUseCase)
	// 	if err != nil {
	// 		log.Fatalf("Failed to import data from Excel: %v", err)
	// 	}
	// 	log.Println("Excel data import completed successfully.")
	// 	return // Exit after import if no further server operations are needed
	// }

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	pensionRepo := repository.NewPensionRepository(db)

	// Initialize use cases
	userUseCase := usecase.NewUserUseCase(userRepo)
	pensionUseCase := usecase.NewPensionUseCase(pensionRepo)

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
			log.Printf("Error closing excel file: %v", err)
		}
	}()

	// Assuming the data is in the first sheet
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

	// Process rows concurrently
	var wg sync.WaitGroup
	for i, row := range rows {
		if i == 0 { // Skip header row
			continue
		}

		// Basic validation for row length (adjust as per your Excel columns)
		if len(row) < 16 { // Corrected to 16 columns based on PensionData struct
			log.Printf("Skipping row %d due to insufficient columns: %v", i+1, row)
			continue
		}

		wg.Add(1)
		go func(r []string) {
			defer wg.Done()

			pensionData := domain.PensionData{}

			// Parse and assign values from row to pensionData struct
			valAG, _ := strconv.ParseInt(r[0], 10, 8)
			pensionData.AG = int8(valAG)
			valAVT, _ := strconv.ParseInt(r[1], 10, 8)
			pensionData.AVT = int8(valAVT)
			pensionData.NPens = r[2]
			pensionData.EtatPens = r[3]
			pensionData.DateNais, _ = time.Parse("02/01/2006 15:04:05", r[4])  // Adjust date format if needed
			pensionData.DateJouis, _ = time.Parse("02/01/2006 15:04:05", r[5]) // Adjust date format if needed
			pensionData.SexeTP = r[6]
			pensionData.NetMens, _ = strconv.ParseFloat(r[7], 64)
			pensionData.TauxD, _ = strconv.ParseFloat(r[8], 64)
			pensionData.TauxRV, _ = strconv.ParseFloat(r[9], 64)
			pensionData.TauxGLB, _ = strconv.ParseFloat(r[10], 64)
			valAgeAppTP, _ := strconv.ParseInt(r[11], 10, 8)
			pensionData.AgeAppTP = int8(valAgeAppTP)
			pensionData.DureePension, _ = strconv.Atoi(r[12])
			valAgeMoyenCat, _ := strconv.ParseInt(r[13], 10, 8)
			pensionData.AgeMoyenCat = int8(valAgeMoyenCat)
			valRisqueAge, _ := strconv.ParseInt(r[14], 10, 8)
			pensionData.RisqueAge = int8(valRisqueAge)
			valNiveauRisquePredit, _ := strconv.ParseInt(r[15], 10, 8)
			pensionData.NiveauRisquePredit = int8(valNiveauRisquePredit)

			// Insert into database
			if err := pensionUseCase.CreatePension(&pensionData); err != nil {
				log.Printf("Error inserting pension data from row %d: %v", i+1, err)
			}
		}(row)
	}

	wg.Wait()
	return nil
}
