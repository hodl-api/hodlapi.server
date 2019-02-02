const axios = require('axios');
const Router = require('koa-router');
const request = require('../models/Request');
const R = require('ramda');
const moment = require('moment');
const config = require('config');
const logger = require('../logger');

const queue = require('../queue');

const router = new Router();

const createRequest = async (ctx) => {
    try {
        let {
            symbols = [], intervals, start, end, email, extensions = ['json', 'csv']
        } = ctx.request.body;

        logger.log({
            level: 'info',
            message: `Request created for ${email}`
        });
        const emailsWhitelist = config.get('emailsWhitelist') || [];
        const isEmailInWhiteList = !!emailsWhitelist.find(e => R.toLower(e || '') === R.toLower(email || ''));
        if (isEmailInWhiteList) {
            start = start || '2017-01-01';
            end = end || moment().format('YYYY-MM-DD');
            R.map(symbol => queue.create('parser.binance', {
                symbol,
                interval,
                range: {
                    start,
                    end
                },
                email,
                extensions
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

router.post('/request', createRequest);

module.exports = router;