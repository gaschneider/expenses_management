import sequelize from '../config/database';
import Expense from './expense';
import User from './user';

// Add all your models here
const models = {
  User,
  Expense
};

// Configure model associations here if needed
// Object.values(models)
//   .filter(model => typeof model.associate === 'function')
//   .forEach(model => model.associate && model.associate(models));

export { sequelize };
export default models;