const disk = require('diskusage');
const os = require('os');
const osu = require('node-os-utils');
var cpu = osu.cpu;

const { Server } = require("socket.io");

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
		cpu.usage().then(v => {
			console.clear();

			console.log('Free Disk:', bytesToSize(info.free));
			console.log('Total Disk: ', bytesToSize(info.total));

			console.log('Total RAM:', bytesToSize(os.totalmem()));
			console.log('Free RAM:', bytesToSize(os.freemem()));

			console.log('CPU Usage:', `${v}%`);
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
		})
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
