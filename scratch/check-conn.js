const net = require('net');

const client = new net.Socket();
const host = 'ep-billowing-wildflower-amt2a84q.c-5.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Attempting to connect to ${host}:${port}...`);

client.setTimeout(10000);

client.connect(port, host, function() {
    console.log('SUCCESS: Connection established!');
    client.destroy();
});

client.on('error', function(err) {
    console.error('ERROR: Connection failed.');
    console.error(err);
    client.destroy();
});

client.on('timeout', function() {
    console.error('TIMEOUT: Connection timed out.');
    client.destroy();
});
