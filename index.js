const axios = require('axios');
const qs = require('querystring');
const sgMail = require('@sendgrid/mail');
const json2html = require('json2html');

const keys = require('./config/keys');

sgMail.setApiKey(keys.sendgridKey);

const run = async () => {
    const topic = "kimchi";
    const accessToken = await getAccessToken();
    const results = await keywordSearch(topic, 'new', 20, accessToken);
    await emailResults(results);
};

const emailResults = async (results) => {
    const to = keys.recipient;
    const from = keys.sender;

    const resObj = {
        results
    };

    const msg = {
        to,
        from,
        subject: 'Daily Reddit Notifications',
        text: '',
        html: json2html.render(resObj),
    };

    await sgMail.send(msg);
}


const keywordSearch = async (keyword, sort, limit, token) => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const after = d.getTime() / 1000;
    
    const url = `https://oauth.reddit.com/r/all/search?q=${keyword}&after=${after}&sort=${sort}&limit=${limit}`;

    
    const headers = { Authorization: `Bearer ${token}` };
    
    const result = await axios({
        method: 'get',
        headers,
        url,
    });
    const posts = result.data.data.children.map(x => x.data);
    //console.log(posts[4]);
    const results = posts.map(x => {
        var dt = new Date(x.created * 1000);
        return {
            subreddit: x.subreddit,
            //upvotes: x.ups,
            //downvotes: x.downs,
            score: x.score,
            title: `<a target="_blank" href=${x.url}>${x.title}</a>`,
            //text: x.selftext,
            //link: x.url,
            date: dt.toLocaleDateString("en-US")
        };
    });

    return results;
};

const getAccessToken = async () => {
    const url = 'https://www.reddit.com/api/v1/access_token';

    const data = {
        'grant_type': 'password',
        'username': keys.redditUser,
        'password': keys.redditPassword,
    };

    const auth = {
        username: keys.clientId,
        password: keys.clientSecret,
    };
    
    const result = await axios({
        method: 'post',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        url,
        data: qs.stringify(data),
        auth,
    });
    return result.data.access_token;
};

run();
 