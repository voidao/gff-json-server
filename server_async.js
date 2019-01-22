//const basicAuth = require('express-basic-auth')
const bodyParser = require('body-parser')

const jsonServer = require('json-server')
const server = jsonServer.create()

const middlewares = jsonServer.defaults()
const port = Number(process.env.PORT || 3000)

var huntingObj;
var fs = require('fs'),
    http = require('http'),
    https = require('https');

var options = {
    key: fs.readFileSync('/etc/letsencrypt/live/service.edening.net/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/service.edening.net/fullchain.pem'),
};

server.use(middlewares)
server.use(bodyParser.json())

const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

// Create database instance and start server
const adapter = new FileAsync('/var/local/db.json');

low(adapter)
    .then(db => {
        // Routes

        // GET /huntings
        server.get('/huntings', (req, res) => {
            const huntings = db.get('huntings');

            res.send(huntings);
        });

        // PATCH /huntings
        server.all('/huntings/:id', (req, res) => {
            if(req.method == "PATCH" && req.body.like) {
                huntingObj = db.get('huntings')
                    .find({ id: req.body.like });
                if(huntingObj) {
                    huntingObj.assign({ likes: { number:  huntingObj.get('likes.number') + 1} })
                        .write()
                        .then(hunting => res.send(hunting))
                        .catch(() => {
                            res.sendStatus(500);
                        });
                } else {
                    res.sendStatus(404);
                }
            } else {
                res.sendStatus(401);
            }
        })

}).then(() => {
    //server.listen(3000, () => console.log('listening on port 3000'));
    https.createServer(options, server).listen(port, function(){
        console.log("JSON Server listening on port: " + port);
    });
})
