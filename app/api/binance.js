const axios = require('axios');
const Router = require('koa-router');
const R = require('ramda');
const moment = require('moment');
const config = require('config');
const logger = require('../logger');

const queue = require('../queue');

const router = new Router();

const symbols = async (ctx) => {
    try {
        const exchange = await axios.default.get('https://api.binance.com/api/v1/exchangeInfo');

        // queue.create('fwriter.write', {
        //     interval: '1m',
        //     symbol: 'ETHBTC',
        //     range: {
        //         start: '2017-06-01',
        //         end: '2018-09-12'
        //     },
        //     extensions: ['json', 'csv']
        // }).save();

        ctx.body = R.compose(
            R.filter(e => e.length > 0),
            R.map(R.propOr('', 'symbol')),
            R.propOr([], 'symbols'),
            R.propOr({}, 'data')
        )(exchange);
    } catch (e) {
        logger.log({
            level: 'error',
            message: R.toString(e)
        });
    }
};

const createJob = async (ctx) => {
    try {
        let {
            symbols = [], intervals, start, end, email
        } = ctx.request.body;

        logger.log({
            level: 'info',
            message: `Request created ${email}`
        });
        const emailsWhitelist = config.get('emailsWhitelist') || [];
        const isEmailInWhiteList = !!emailsWhitelist.find(e => R.toLower(e || '') === R.toLower(email || ''));
        if (isEmailInWhiteList) {
            start = start || '2017-01-01';
            end = end || moment().format('YYYY-MM-DD');
            R.map(symbol => queue.create('parser.binance', {
                symbol,
                interval,
                start,
                end
            }).save())(symbols);
            ctx.status = 200;
            ctx.body = {
                status: 200,
                message: 'Success'
            };
        } else {
            ctx.status = 403;
            ctx.body = {
                status: 403,
                message: 'Permissions denied'
            };
            logger.log({
                level: 'error',
                message: ` ${email} isn't in white list`
            });
        }
    } catch (e) {
        ctx.status = 403;
        ctx.body = e;

        logger.log({
            level: 'error',
            message: R.toString(e)
        });
    }
};

router.get('/symbols', symbols);
router.post('/parse', createJob);

module.exports = router;