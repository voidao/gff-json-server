const auth = require('basic-auth')
const bodyParser = require('body-parser')

const jsonServer = require('json-server')
const server = jsonServer.create()

const middlewares = jsonServer.defaults();

const user = process.env.GFF_USER || "";
const pass = process.env.GFF_PASS || "";

const fs = require('fs');
const filePath = '/tmp/db.json';

// /tmp/db.json will be created or overwritten by default. Warning: removed each time each deployment goes to sleep, see https://zeit.co/docs/v1/deployment-types/node#file-system-specifications
fs.copyFileSync(__dirname + '/../db.json', filePath);
console.log('db.json was copied from ' + __dirname + '/../ to ' + filePath);

var huntingObj;

server.use(middlewares);
server.use(bodyParser.json());

function isAuthorized(req) {

    var result = false;

    var credentials = auth(req);

    if(credentials && credentials.name == user && credentials.pass == pass) {
        result = true;
    } else {
        result = false;
    }

    return result;
}

const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

// Create database instance and start server
const adapter = new FileAsync(filePath);

low(adapter)
    .then(db => {
        // Routes
        // ALL /huntings
        server.all('/huntings', (req, res) => {
            if(req.method == "GET") {
                const huntings = db.get('huntings');

                res.send(huntings);
            } else if(req.method == "POST" && isAuthorized(req)) {
                db.get('huntings')
                    .push(req.body)
                    .last()
                    .write()
                    .then(hunting => res.send(hunting))
                    .catch(() => res.sendStatus(500));
            } else {
                res.sendStatus(401);
            }
        });

        // ALL /huntings/:id
        server.all('/huntings/:id', (req, res) => {

            if(req.method == "GET") {
                const hunting = db.get('huntings')
                    .find({ id: req.body.id })
                    .value();

                res.send(hunting);
            } else if(req.method == "PUT" && isAuthorized(req)) {
                db.get('huntings')
                    .find({ id: req.body.id })
                    .assign(req.body)
                    .write()
                    .then(hunting => res.send(hunting))
                    .catch(() => res.sendStatus(500));
            }  else if(req.method == "DELETE" && isAuthorized(req)) {
                db.get('huntings')
                    .remove({ id: req.body.id })
                    .write()
                    .then(hunting => res.send(hunting))
                    .catch(() => res.sendStatus(500));
            } else if(req.method == "PATCH" && req.body.like) {
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
        });

}).then(() => {
    server.listen();
    console.log("JSON Server listening ...");
});
