const disk = require('diskusage');
const os = require('os');
const osu = require('node-os-utils');
var cpu = osu.cpu;
const express = require('express');
const app = express();
const { Server } = require("socket.io");
const NetworkSpeed = require('network-speed');  // ES5
const testNetworkSpeed = new NetworkSpeed();

async function getNetworkDownloadSpeed() {
  	const baseUrl = 'https://httpbin.org/stream-bytes/500000';
  	const fileSizeInBytes = 500000;
  	const speed = await testNetworkSpeed.checkDownloadSpeed(baseUrl, fileSizeInBytes);
  	return speed;
}

async function getNetworkUploadSpeed() {
	const options = {
	  hostname: 'www.google.com',
	  port: 80,
	  path: '/catchers/544b09b4599c1d0200000289',
	  method: 'POST',
	  headers: {
		'Content-Type': 'application/json',
	  },
	};
	const fileSizeInBytes = 20000
	const speed = await testNetworkSpeed.checkUploadSpeed(options, fileSizeInBytes);
	return speed;
}
const io = new Server(3000, { cors: {    origin: "*"  } });

io.on("connection", (socket) => {
	console.log("New Connection");
	socket.on("disconnect", () => {
		console.log("Disconnect");
	});
	socket.on("freeRam", () => {
		cleanRam();
	})
});


function checkServerStats(){
	disk.check('/', function(err, info){
		Promise.all([getNetworkDownloadSpeed(), getNetworkUploadSpeed()]).then(function(values) {
		const InternetSpeed = {
			download: values[0],
			upload: values[1],
		}
		cpu.usage().then(v => {
			console.clear();

			console.log('Free Disk:', bytesToSize(info.free));
			console.log('Total Disk: ', bytesToSize(info.total));

			console.log('Total RAM:', bytesToSize(os.totalmem()));
			console.log('Free RAM:', bytesToSize(os.freemem()));

			console.log('CPU Usage:', `${v}%`);
			console.log('Download Speed:', `${InternetSpeed.download.mbps} Mbps`);
			console.log('Upload Speed:', `${InternetSpeed.upload.mbps} Mbps`);
			
			io.emit('stats', {
				free: bytesToSize(info.free),
				total: bytesToSize(info.total),
				disk: {
					total: info.total,
					free: info.free,
					used: info.total - info.free,
					formattedFree: bytesToSize(info.free),
					formattedTotal: bytesToSize(info.total),
					formattedUsed: bytesToSize(info.total - info.free),
					percentageUsed: `${(((Math.abs(info.total - info.free)) / info.total) * 100).toFixed(2)}%`,
					percentageFree: `${((info.free / info.total) * 100).toFixed(2)}%`
				},
				networkSpeed: InternetSpeed,
				ram: {
					total: os.totalmem(),
					free: os.freemem(),
					used: os.totalmem() - os.freemem(),
					
					formattedUsed: bytesToSize(os.totalmem() - os.freemem()),
					percentageUsed: `${(((Math.abs(os.freemem() - os.totalmem())/os.totalmem())*100).toFixed(2))}%`,
					percentageAvailable: `${((os.freemem()/os.totalmem())*100).toFixed(2)}%`,
					formattedTotal: bytesToSize(os.totalmem()),
					formattedFree: bytesToSize(os.freemem()),
				},
				cpu: `${v}%`
			});
			setTimeout(checkServerStats, 1000);
		});
		}).catch(function(err) {
			setTimeout(checkServerStats, 1000);
		});
	});
}

function bytesToSize(bytes, decimals=2){
	if(bytes === 0) return '0 Byes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function cleanRam(){
	const { exec } = require("child_process");
	exec("sudo sync && echo 3 > /proc/sys/vm/drop_caches", (error, stdout, stderr) => {
		if (error) {
			return;
		}
		if (stderr) {
			return;
		}
	});
}
checkServerStats();

//Setup express server
app.use(express.static('public'));
app.listen(8080, () => {
	console.log('Server started on port 8080');
});
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});