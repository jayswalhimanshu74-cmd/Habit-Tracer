require('dotenv').config({ path: '../.env' });

module.exports = async () => {
    console.log('DB_PASSWORD',process.env.DB_PASSWORD);
};