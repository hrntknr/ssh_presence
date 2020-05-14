const {Client} = require('discord-rpc');
const ps = require('ps-node');
const {promisify} = require('util');

const multiParams = 'BbcDEeFIiJLlmOopQRSWw';
const clientId = '704741268021969027';
let processes = [];
const currentPid = 0;

(async ()=>{
  const rpc = new Client({transport: 'ipc'});
  rpc.once('ready', async ()=>{
    console.log('Successfully connected to Discord.');
  });
  await rpc.login({clientId});
  setInterval(async () => {
    const results = await promisify(ps.lookup)({command: 'ssh'});
    const sshProcesses = results
      .filter((item)=>item.command.split('/').pop() === 'ssh');

    sshProcesses.forEach((item)=>{
      const index = processes.findIndex((oldItem)=>oldItem.pid == item.pid);
      if (index === -1) {
        item.time = new Date();
      } else {
        item.time = processes[index].time;
      }
    });
    processes = sshProcesses;

    if (processes.length == 0) {
      await rpc.clearActivity();
      return;
    }
    const newest = processes.reduce((a, b)=>{
      if (a.time>b.time) {
        return a;
      } else {
        return b;
      }
    });
    if (currentPid === newest.pid) {
      return;
    }

    let skipNext = false;
    let target = '';
    for (const arg of newest.arguments) {
      if (skipNext) {
        skipNext = false;
        continue;
      }
      if (arg.startsWith('-') && arg.length === 2) {
        if (multiParams.includes(arg[1])) {
          skipNext = true;
        }
        continue;
      }
      target = arg;
    }
    const server = target.split('@').pop();

    const activity = {
      state: `Server: ${server}`,
      details: 'Connecting via SSH',
      startTimestamp: Math.floor(newest.time/1000),
      largeImageKey: 'ssh',
      largeImageText: 'ssh',
    };

    await rpc.setActivity(activity);
  }, 1000);
})();
