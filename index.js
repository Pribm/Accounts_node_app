import chalk from "chalk";
import inquirer from "inquirer";

//modulos internos
import * as fs from 'fs'

createDirectoryIfDoesntExists()
operation()

function operation(type, userName = '', message = chalk.bgGreen.black(`Seja bem vindo ao Banco Node.JS, o que você deseja fazer?`)) {  
  console.clear()
  let options = {}

  if(type === 'loggedIn'){
    options = {
      CONSULTAR_SALDO: 'Consultar Saldo',
      SACAR: 'Sacar',
      DEPOSITAR: 'Depositar',
      SAIR: 'Sair'
    } 
  }
  else if(type === 'positiveBalance'){
    options = {
      SACAR: 'Sacar',
      DEPOSITAR: 'Depositar',
      VOLTAR: 'voltar',
    } 
  }
  else if(type === 'negativeBalance'){
    options = {
      DEPOSITAR: 'Depositar',
      VOLTAR: 'Voltar',
    } 
  }
  else{
    options = {
      CRIAR_CONTA: 'Criar conta',
      FAZER_LOGIN: 'Fazer login com uma conta existente',
      SAIR: 'Sair'
    } 
    
  }

  inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: message,
    choices: Object.keys(options).map(option => options[option])
  }
  ]).then(answer => {
    switch (answer.action) {
      case options.CRIAR_CONTA:
        createAccount()
        break;
      case options.FAZER_LOGIN:
        login()
        break;
      case options.CONSULTAR_SALDO:
        checkBalance(userName)
        break;
      case options.SACAR:
        makeMoneyTransaction(userName, 'withdraw')
        break;
      case options.DEPOSITAR:
        makeMoneyTransaction(userName, 'deposit')
        break;
      case options.VOLTAR:
        operation('loggedIn', userName)
        break;
      case options.SAIR:
        operation('', userName)
        break;

      default:
        console.log('nenhuma opção selecionada')
        break;
    }
  })
    .catch(err => console.log(err))
}

const createAccount = (errorMessage = null) => {
  console.clear()
  inquirer.prompt([{
    name: "name",
    type: 'input',
    message: errorMessage ? errorMessage : 'Este nome já existe no nosso banco de dados, por favor escolha um novo nome'
  },{
    name: 'password',
    message: 'Insira uma senha',
    type: "password"
  }])
    .then(answer => {

      const usersData = JSON.parse(fs.readFileSync('./database/users.json'))
      let canRegisterNewUser = true
      
      usersData.forEach(user => {
        if(user.name === answer.name){
          canRegisterNewUser = false
        }
      });

      if(canRegisterNewUser){
        if (answer.name && answer.name !== '' && answer.password && answer.password !== '') {
          console.log(`Seja bem vindo ${chalk.green(answer.name)}`)
          
          usersData.push({name: answer.name, password:answer.password, saldo: 0})
          fs.writeFile('./database/users.json', JSON.stringify(usersData), err => {
            if (err) throw err;
            console.log('parabéns, você está registrado no nosso banco de dados!')
            operation('loggedIn', answer.name, `Olá ${chalk.bgGreen.black(answer.name)}, o que você deseja fazer?`)
          })
        } else {
          createAccount(`${chalk.bgRed('!!!ERRO!!! => ')} Por favor, insira um nome válido \r\n`)
        }
      }else{
        createAccount(`${chalk.bgRed('Este nome já existe no nosso banco de dados, por favor escolha um novo nome \r\n')}`)
      }

    })
    .catch(err => console.log(err))
}

const login = () => {
  console.clear()
  inquirer.prompt([
    {
      message: 'insira seu nome',
      name: 'name',
      type: 'input'
    },
    {
      name: 'password',
      message: 'Insira sua senha',
      type: 'input'
    }
  ]).then(answer => {
    if(checkUserDatabase(answer)){
      operation('loggedIn', answer.name, `Olá ${chalk.bgGreen.black(answer.name)}, o que você deseja fazer?`)
    }else{
      console.log(chalk.bgRed(`Não foi possível realizar o login \r\n\r\n`))
      setTimeout(() => operation(), 1000)
    }
  }).catch(err => console.log(err))
}

const checkBalance = (userName) => {
  let userBalance = fs.readFileSync('./database/users.json')
  userBalance = JSON.parse(userBalance).filter(user => user.name === userName)[0].saldo
  
  if(userBalance !== 0){
    operation('positiveBalance',userName, `Seu saldo é de ${chalk.bgGreen.black('R$ '+userBalance)} o que você deseja fazer?`)
  }else{
    operation('negativeBalance',userName, `Seu saldo é de ${chalk.bgRed('R$ '+userBalance)} o que você deseja fazer?`)
  }
}

const makeMoneyTransaction = (userName, transactionType) => {
  console.clear()

  inquirer.prompt([
    {
      message: `Insira o valor que você deseja ${transactionType === 'deposit' ? 'depositar' : 'retirar'}`,
      name: 'moneyAmount',
      type: 'number'
    }
  ])
  .then(answer => {
    let userDatabase = JSON.parse(fs.readFileSync('./database/users.json'))
    let userIndex = userDatabase.findIndex(user => user.name === userName)
    
    if(transactionType === 'deposit')
    {
      userDatabase[userIndex].saldo += answer.moneyAmount
    }
    if(transactionType === 'withdraw'){
      if(userDatabase[userIndex].saldo <= 0)
      {
        operation('negativeBalance',userName, `Seu saldo é de ${chalk.bgRed('R$ '+userDatabase[userIndex].saldo)}, você precisa depositar algum dinheiro para poder fazer um saque!`)
        return
      }
      else if(answer.moneyAmount > userDatabase[userIndex].saldo)
      {
        operation('negativeBalance',userName, `Seu saldo é de ${chalk.bgRed('R$ '+userDatabase[userIndex].saldo)}, e você deseja sacar ${answer.moneyAmount}, você precisa depositar mais dinheiro para sacar o valor desejado!`)
        return
      }
      else{
        userDatabase[userIndex].saldo -= answer.moneyAmount
      }
    }

    fs.writeFileSync('./database/users.json', JSON.stringify(userDatabase))
    operation('loggedIn', userName)
  })
  .catch(err => console.log(err))
}

const checkUserDatabase = (credentials) => {
  const usersData = JSON.parse(fs.readFileSync('./database/users.json'))
  
  return usersData.some(userData => {
    return (userData.name === credentials.name)
  })
}

function createDirectoryIfDoesntExists() {
  let dir = './database'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

