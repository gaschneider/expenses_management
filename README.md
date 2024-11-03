
# Expenses Management


## How to setup the project locally

  Start by cloning this repository

Check if you have node installed by using the command `node -v`, this project was built using v22, so I would recommend using it to run, if you don't have installed or already have another version you have 2 options:
- Go to [here](https://nodejs.org/en/download/package-manager) and install the proper version
- Go to [here](https://github.com/coreybutler/nvm-windows/releases) and install the latest nvm, this is a way to have multiple nodes version on your machine
-- run `nvm` in the powershell, it should accept the the command
-- run `nvm install 22.11.0`
-- run `nvm use 22.11.0`

Check if you have MySQL installed, this project uses the Community Server 9.1.0, you can download the latest from [here](https://dev.mysql.com/downloads/mysql/)
- During the installation it will request a password, remember it because you will need to put that password in the files `.env` under folder `server` in the variable `DB_PASSWORD`


Now to configure the client, in the terminal navigate to the folder `client` and run `npm install`

To configure the server, in the terminal, navigate to the folder `server`:
- run `npm install`
- run `npm run create-db`

After those steps you should have all setup

## How to run

Navigate to server folder in the terminal
- Execute the command `npm start`

Navigate to client folder in the terminal
- Execute the command `npm start`

A browser window should open and show to you the app running

## Questions ?

If you have any questions or feedback, don't hesitate to contact us!