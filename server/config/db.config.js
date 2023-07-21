module.exports = {
    HOST: "127.0.0.1",
    USER: "apanemia",
    PASSWORD: "Milkmilk1!",
    DB: "MF2023",
    dialect: "mysql",
    logging: false,
    synchronize: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };