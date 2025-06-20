# CNR Pension Data Management System

This system manages pension data with the ability to import data from Excel files into a MySQL database.

## Setup and Usage

### Prerequisites
- Docker and Docker Compose
- Excel files containing pension data

### Default Admin User
The system comes with a default admin user:
- Email: admin@gmail.com
- Password: admin

### Excel File Format
The Excel file should have the following columns in order:
1. AG (int8)
2. AVT (int8)
3. NPens (string)
4. EtatPens (string)
5. DateNais (datetime)  like this 1983-10-01 00:00:00
6. DateJouis (datetime) like this 1922-12-31 00:00:00
7. SexeTP (string)
8. NetMens (float64)
9. TauxD (float64)
10. TauxRV (float64)
11. TauxGLB (float64)
12. AgeAppTP (int8)
13. DureePension (int)
14. AgeMoyenCat (int8)
15. RisqueAge (int8)
16. NiveauRisquePredit (int8)

### Running the Application

1. Create an `excel_data` directory in the project root:
```bash
mkdir excel_data
```

2. Place your Excel files (.xlsx or .xls) in the `excel_data` directory.



3. Start the application:
```bash
docker-compose up -d
```

The system will:
- Start the MySQL database
- Start the backend service which will automatically process any Excel files in the `excel_data` directory
- Start the frontend service

### Excel Import Process
- The backend service automatically scans the `excel_data` directory for Excel files
- Each Excel file found will be processed and its data imported into the database
- The import process logs its progress and any errors encountered
- You can check the logs using:
```bash
docker-compose logs -f backend
```

### Accessing the Application
- Frontend: http://localhost:8081
- Backend API: http://localhost:8080

## Troubleshooting
- If Excel files are not being processed, check the backend logs for any errors
- Ensure Excel files are in the correct format with all required columns
- Verify that the database credentials in the `.env` file are correct
- Make sure the Excel files have the correct file extensions (.xlsx or .xls) 