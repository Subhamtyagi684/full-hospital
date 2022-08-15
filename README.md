STEPS TO RUN THIS APPLICATION:

STEP-1===============================================================
    Create .env file in base directory.Add following database config in .env file with variable names:
        MYSQL_HOST
        MYSQL_USER
        MYSQL_DATABASE
        MYSQL_PASSWORD

        Note: All four variables are mandatory for database configuration.

    RUN 'npm i' command. if no errors, go to next step.

STEP-2===============================================================
    run command 'npm run load' to add pre-requisites tables in database.
    Once data is added and command ran successfully, run command 'npm run start'



STEP-3===============================================================
    if everything ran successfully:

    API END POINTS:

    1. URL:     http://localhost:3000/register
       METHOD:  POST
       PARAMS:
            name
            address
            email
            phone_no
            password
            profile
            psychiatrist_id
    
    2.  URL:     http://localhost:3000/getDetail/:hospital_id
        METHOD:  GET
