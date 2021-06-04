let [option] = process.argv.slice(2);
option = (option ?? "").trim();

const pidReg = /^-p:/i;
const portReg = /^-i:/i;

if (!option || (!pidReg.test(option) && !portReg.test(option))) {
  console.log(`
lsof -i:port      查询占用port的进程
lsof -p:pid       查询进程ID为pid的进程
  `);
  process.exit(1);
}

let pidList = [];
if (portReg.test(option)) {
  const inputPort = option.trim().replace(portReg, "");
  const pidResult = await $$`netstat -aon | findstr :${inputPort}`.catch(
    (e) => {
      return "";
    }
  );

  pidList = Array.from(
    new Set(
      pidResult.split(/[\r\n]+/).map((line) => {
        return line.replace(/.*\s+/, "");
      })
    )
  )
    .filter((port) => {
      return port !== "0" && port !== "";
    })
    .sort()
    .reverse();
} else if (pidReg.test(option)) {
  pidList.push(option.replace(pidReg, ""));
}

const taskStr = await $$`tasklist`;
const tasks = taskStr.split(/[\r\n]+/);
const taskMap = tasks.reduce((r, line) => {
  const temp = line.trim().split(/\s{4,}/);

  const pid = (temp[1] ?? "").trim().replace(/[^\d]+/, "");
  r[pid] = [temp[0], temp[4] ?? ''];
  return r;
}, {});

const result = pidList
  .map((pid) => {
    return [pid, ...(taskMap[pid] ?? [])];
  })
  .map((list) => {
    return (
      list
        .map((str, index) => {
          return str.padStart(index === 0 ? 6 : index === 1 ? 20 : 10, " ");
        })
        .join("  ") +
      "        " +
      `TASKKILL /PID ${list[0]} /T`
    );
  })
  .join("\n");

console.log(result);
