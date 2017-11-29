var loadenv = () => {

    if (!process.env.NODE_ENV) {
        // explicitly loading variables from .env files if is in development
        require('dotenv').load()

        // check which modes the app is running
        console.log('NODE_ENV: ' + process.env.NODE_ENV + ' mode')
    }

}

module.exports = loadenv