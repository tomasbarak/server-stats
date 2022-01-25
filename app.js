const disk = require('diskusage');
const os = require('os');
const osu = require('node-os-utils');
var cpu = osu.cpu;
function checkServerStats(){
	disk.check('/', function(err, info){
		cpu.usage().then(v => {
			console.clear();

			console.log('Free Disk:', bytesToSize(info.free));
			console.log('Total Disk: ', bytesToSize(info.total));

			console.log('Total RAM:', bytesToSize(os.totalmem()));
			console.log('Free RAM:', bytesToSize(os.freemem()));

			console.log('CPU Usage:', `${v}%`);
			setTimeout(checkServerStats, 10);
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

checkServerStats();
