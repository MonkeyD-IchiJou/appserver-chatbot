// return a promise to check whether the email exist in DB or not
exports.checkEmailInDB = (db, user_email) => {

    return new Promise((resolve, reject) => {

        // check with mariadb/mysql whether this email is in used or not
        let query = db.query(
            'SELECT EXISTS(SELECT * FROM users WHERE email=?) AS solution',
            [user_email]
        );

        query.on('error', (err) => {

            console.error(err);
            reject({ email: { msg: "email alr exists in the db" } });

        }).on('result', (row) => {

            row.solution ? reject({ email: { msg: "email alr exists in the db" } }) : resolve('UniqueEmail');

        });

    });

};

// return a promise to register user in the db
exports.registerUser = (db, user_email, user_username, hash) => {

    return new Promise((resolve, reject) => {

        // if email is unique then
        // insert this new user into my database
        db.query(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
            [user_email, user_username, hash],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    return reject(dberror);
                }
                else {

                    // successfully insert the new user into the db
                    resolve('true');

                }
            }
        );

    });

};

// first find the id for this user in the db
exports.findUserIdInDB = (db, user_email) => {

    return new Promise((resolve, reject) => {

        // check with mariadb/mysql whether this email is in used or not
        let query = db.query(
            'SELECT id FROM users WHERE email=?',
            [user_email]
        );

        query.on('error', (err) => {

            reject(err);

        }).on('result', (row) => {

            resolve(row.id);

        });

    });

}

// return a promise to Insert new default data in users_plans
exports.registerUserPlan = (db, user_id, plan_id) => {

    return new Promise((resolve, reject) => {

        db.query(
            'INSERT INTO users_plans(user_id, plan_id) VALUES (?, ?)',
            [user_id, plan_id],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    return reject(dberror);
                }
                else {

                    // successfully insert the new users_plans into the db
                    resolve('true');

                }
            }
        );

    });

}

// return a promise to update the confirmation to true
exports.updateConfirmation = (db, user_email) => {

    return new Promise((resolve, reject) => {

        db.query(
            'UPDATE users SET confirm=1 WHERE email=(?)',
            [user_email],
            (dberror, results, fields) => {
                if (dberror) {

                    // send db error if got any
                    reject('Invalid Token, u hacka?');

                }
                else {

                    // successfully update the user confirmation
                    resolve('Thank you for joining! ' + user_email);

                }
            }
        );

    });
    
}

// return promise to find the user in the db
exports.findUserPasswordAndConfirmInDB = (db, user_email) => {

    return new Promise((resolve, reject) => {

        // find the user in the db by using the email
        db.query(
            'SELECT password, confirm FROM users WHERE email=?',
            [user_email],
            (dberror, results, fields) => {

                if (dberror) {
                    console.log('db error when searching password from email');
                    // send db error if got any
                    return reject(dberror);
                }
                else {

                    if (results.length > 0) {
                        // results is not empty

                        if (!results[0].confirm) {
                            // if the user havent confirm this email, reject
                            reject({ emailconfirm: false });
                        }
                        else {
                            // if the user alr confirm this email, then carry on
                            resolve(results[0].password);
                        }

                    }
                    else {
                        // cannot find this user email in the db
                        reject({ email: { msg: "email is not exist in the db" } })
                    }

                }

            }
        );

    });

};

// return promise to update the last login time for the user
exports.UpdateLoginTimestamp = (db, user_email) => {

    return new Promise((resolve, reject) => {
        // then update db about confimation
        // connect to mariadb/mysql
        db.query(
            'UPDATE users SET lastlogin=CURRENT_TIMESTAMP WHERE email=(?)',
            [user_email],
            (dberror, results, fields) => {

                if (dberror) {
                    console.log('db error when updating lastlogin from email');
                    // send db error if got any
                    return reject(dberror);
                }
                else {
                    // if I have updated the timestamp, then carry on
                    resolve('true');
                }

            });
    });

};

// return a promise to gather all the projects that this user have
exports.findAllUserProjects = (db, user_id) => {

    return new Promise((resolve, reject) => {
        db.query(
            'SELECT name FROM projects WHERE createdby=?',
            [user_id],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    return reject(dberror);
                }
                else {
                    // return user id and current total projects number
                    resolve(results);
                }
            }
        );
    });

};

// secondly insert the new project into the db
exports.createNewProject = (db, user_id, projectname, projectDescription) => {

    return new Promise((resolve, reject) => {
        db.query(
            'INSERT INTO projects (createdby, name, description) VALUES (?, ?, ?)',
            [user_id, projectname, projectDescription],
            (dberror, results, fields) => {
                if (dberror) {
                    // send db error if got any
                    return reject(dberror);
                }
                else {

                    // successfully insert the new project into the db
                    resolve(true);

                }
            }
        );
    });

};