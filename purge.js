const pm2 = require('pm2');
const os = require('os');
async function initializePurge() {
    setInterval(async () => {
        const { snapshot } = require("process-list");
        snapshot('pid', 'pmem', 'cpu').then(async (tasks) => {
            const parsedProcesses = parseProcesses(tasks);
            const protectedPIDs = await getProtectedPIDs()
            console.log(parsedProcesses);
            for (let i = 0; i < parsedProcesses.length; i++) {
                const memPercentUsed = (parsedProcesses[i].oldPmem / os.totalmem() * 100).toFixed(2);
                if (memPercentUsed > 40 || parsedProcesses[i].cpu > 50) {
                    console.log(`Process with PID: ${parsedProcesses[i].pid} is using ${memPercentUsed}% of memory.`);
                    purge(parsedProcesses[i].pid, protectedPIDs);
                }
            }
        });
    }, 1000)
}

function sortProcessByMemory(a, b) {
    if (a.oldPmem / 100 < b.oldPmem / 100)
        return 1;
    if (a.oldPmem / 100 > b.oldPmem / 100)
        return -1;
    return 0;
}
function purge(pid, protectedPids) {
    if (!protectedPids.includes(pid)) {
        process.kill(pid, 'SIGKILL');
        console.log(`Killed process with PID: ${pid}`);
    }
}

function parseProcesses(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        tasks[i].oldPmem = tasks[i].pmem;
        tasks[i].pmem = bytesToSize(tasks[i].pmem);
    }
    tasksMem = tasks.sort(sortProcessByMemory);
    return tasks;
}

function bytesToSize(bytes, decimals = 2) {
    if (Number(bytes) === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function getProtectedPIDs() {
    return new Promise((resolve, reject) => {
        pm2.connect(function (err) {
            if (err) {
                console.error(err);
                process.exit(2);
            }
            pm2.list(function (err, procs) {
                if (err) {
                    console.error(err);
                    process.exit(2);
                }
                const protectedPIDs = [];
                for (let i = 0; i < procs.length - 1; i++) {
                    protectedPIDs.push(procs[i].pid);
                }
                pm2.disconnect();
                resolve(protectedPIDs);
            });
        });
    })
}
initializePurge();