import React, { Component } from 'react';

class App extends Component {

    constructor(props) {
        super(props);

        console.log(window.projectID);

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
                    this is the main chatbot ui
                </p>
            </div>
        );
    }
}

export default App;