const {
    connect
} = require('./app/db');
const queue = require('./app/queue');

connect().then(e => {
    console.log('Connected to mongo');
});

if (process.env.NODE_ENV === 'production') {
    process.on('uncaughtException', function (error) {
        process.exit(1);
    });

    process.on('unhandledRejection', function (error) {
        process.exit(1);
    });
}