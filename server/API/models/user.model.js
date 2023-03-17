module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
        first_name: {
            type: Sequelize.STRING
        },
        last_name: {
            type: Sequelize.STRING
        },
        username: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        phone: {
            type: Sequelize.STRING
        },
        city: {
            type: Sequelize.STRING
        },
        country: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        age: {
            type: Sequelize.INTEGER
        },
        gender: {
            type: Sequelize.STRING
        },
        birthday: {
            type: Sequelize.STRING
        },
        verified: {
            type: Sequelize.INTEGER
        },
        verifiedDate: {
            type: Sequelize.STRING
        },
        active: {
            type: Sequelize.INTEGER
        },
        date_joined: {
            type: Sequelize.STRING
        },
        last_login: {
            type: Sequelize.STRING
        },
        login_count: {
            type: Sequelize.INTEGER
        },
        profile_url: {
            type: Sequelize.STRING
        },
        profile_img: {
            type: Sequelize.STRING
        },
        tna: {
            type: Sequelize.INTEGER
        },
        tnaDate: {
            type: Sequelize.STRING
        },
    });
  
    return User;
};