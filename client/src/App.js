import dotev from 'dotenv';
import React, { Component } from 'react';

if (process.env.NODE_ENV !== 'production') {
    // explicitly loading variables from .env files if is in development
    dotev.config();
}

class App extends Component {

    constructor(props) {
        super(props);

        // check which modes the app is running
        console.log('NODE_ENV: ' + process.env.NODE_ENV + ' mode');

        // determine which server url to fetch data from
        let url = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/' : 'http://';

        this.state = {
            appserver_url: url
        };
    }

    render() {
        return (
            <div>
                <header>
                    <h1>Welcome to {process.env.NODE_ENV}</h1>
                </header>
                <p>
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
            </div>
        );
    }
}

export default App;