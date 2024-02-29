module.exports = {
    HOST: "127.0.0.1",
    // HOST: "45.74.56.211",
    // USER: "apanemia2",
    // PASSWORD: "Milkmilk1!",
    USER: "root",
    PASSWORD: "root",
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