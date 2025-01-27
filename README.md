# Expenses Management

## How to setup the project locally

Start by cloning this repository

Check if you have node installed by using the command `node -v`, this project was built using v22, so I would recommend using it to run, if you don't have installed or already have another version you have 2 options:

- Go to [here](https://nodejs.org/en/download/package-manager) and install the proper version
- Go to [here](https://github.com/coreybutler/nvm-windows/releases) and install the latest nvm, this is a way to have multiple nodes version on your machine
  - run `nvm` in the powershell, it should accept the command
  - run `nvm install 22.11.0`
  - run `nvm use 22.11.0`

Check if you have MySQL installed, this project uses the Community Server 9.1.0, you can download the latest from [here](https://dev.mysql.com/downloads/mysql/)

- During the installation it will request a password, remember it because you will need to put that password in the files `.env` under folder `server` in the variable `DB_PASSWORD`
- For those `.env` files, create a `.env.development` following the `.env.example` add your password to the `DB_PASSWORD`, if you wanna run the tests, create a `.env.test` and to run for production `.env.production`
- Also you gonna need to change the NODE_ENV variable in the .env file you created to match either `development`, `test`, `demo` or `production`

PS: If you prefer to run the app with some demo data provided, please refer to the end of this doc

Now to configure the client, in the terminal navigate to the folder `client` and run `npm install`

To configure the server, in the terminal, navigate to the folder `server`:

- run `npm install`
- run `npm run create-db`
- run `npm run db:migrate`

After those steps you should have all setup to start using the system

## How to run

Navigate to server folder in the terminal

- Execute the command `npm start`
- Another option is also execute `npm run dev` it will run the server using the typescript files instead of js built ones.

Navigate to client folder in the terminal

- Execute the command `npm start`

A browser window should open and show to you the app running

## Questions ?

If you have any questions or feedback, don't hesitate to contact us!

## Demo information

- To use the data we left prepared, you can start by creating a `.env.demo`

To seed the data, during the server configuration step, after `db:migrate` you can execute the following command

- run `npm run seed-demo`

To run the server in demo, execute `npm run demo` it will properly connect to the seeded data

Accounts available to use (email, password):

- Admin Example (`admin@example.com`, `admin123`)
- Manager Example (`manager@example.com`, `manager123`)
- IT Leader (`it_leader@example.com`, `ITLeader123`)
- IT User (`it_user@example.com`, `ITUser123`)
- HR Leader (`HRLeader123@example.com`, `HRLeader123`)
- Finance Leader (`finance_leader@example.com`, `financeLeader123`)
